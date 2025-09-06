# Redis-Enhanced Detection Handler for ARCIS System
import threading
import time
import json
import hashlib
import logging
import cv2
from typing import Dict, List, Any, Optional
from redis_system.redis_config import RedisManager, create_frame_hash

logger = logging.getLogger(__name__)

class RedisDetectionHandler:
    """Enhanced detection handler with Redis integration"""
    
    def __init__(self, device_id: str, device_config: Dict[str, Any]):
        self.device_id = device_id
        self.device_config = device_config
        self.redis_manager = RedisManager(device_id)
        
        # Redis connection status
        self.redis_connected = False
        self.redis_retry_count = 0
        self.max_redis_retries = 3
        
        # Detection caching
        self.inference_cache_hits = 0
        self.inference_cache_misses = 0
        
        # Cross-device detection tracking
        self.remote_detections = {}  # Track detections from other devices
        self.last_redis_heartbeat = 0
        self.heartbeat_interval = 30  # seconds
        
        # Detection coordination
        self.detection_coordination_lock = threading.Lock()
        self.coordinated_response_threshold = 2  # If 2+ devices detect, enhanced response
        
        # Start Redis connection and services
        self._initialize_redis()
    
    def _initialize_redis(self) -> bool:
        """Initialize Redis connection and start background services"""
        try:
            self.redis_connected = self.redis_manager.connect()
            
            if self.redis_connected:
                # Start background services
                self._start_redis_services()
                logger.info(f"🚀 Redis services started for {self.device_id}")
            else:
                logger.warning(f"⚠️ Operating without Redis - limited coordination")
            
            return self.redis_connected
            
        except Exception as e:
            logger.error(f"Redis initialization error: {e}")
            return False
    
    def _start_redis_services(self):
        """Start Redis background services"""
        # Detection event subscriber
        detection_thread = threading.Thread(
            target=self._detection_subscriber, 
            daemon=True, 
            name=f"RedisDetectionSub-{self.device_id}"
        )
        detection_thread.start()
        
        # Heartbeat thread
        heartbeat_thread = threading.Thread(
            target=self._heartbeat_worker, 
            daemon=True, 
            name=f"RedisHeartbeat-{self.device_id}"
        )
        heartbeat_thread.start()
        
        logger.info(f"📡 Redis background services started for {self.device_id}")
    
    def _detection_subscriber(self):
        """Subscribe to detection events from other devices"""
        try:
            def handle_remote_detection(event_data: Dict[str, Any]):
                """Handle detection event from another device"""
                remote_device = event_data.get('device_id', 'unknown')
                detection_objects = event_data.get('objects', [])
                confidence = event_data.get('max_confidence', 0)
                timestamp = event_data.get('timestamp', time.time())
                
                logger.info(f"📡 Remote detection from {remote_device}: {detection_objects} ({confidence:.3f})")
                
                with self.detection_coordination_lock:
                    self.remote_detections[remote_device] = {
                        'objects': detection_objects,
                        'confidence': confidence,
                        'timestamp': timestamp,
                        'detection_id': event_data.get('detection_id', 'unknown')
                    }
                    
                    # Clean old remote detections (older than 60 seconds)
                    current_time = time.time()
                    expired_devices = [
                        dev for dev, data in self.remote_detections.items()
                        if current_time - data['timestamp'] > 60
                    ]
                    
                    for expired_dev in expired_devices:
                        del self.remote_detections[expired_dev]
                        logger.debug(f"🧹 Cleaned expired detection from {expired_dev}")
            
            # Subscribe to detection events
            self.redis_manager.subscribe_to_detections(handle_remote_detection)
            
        except Exception as e:
            logger.error(f"Detection subscriber error: {e}")
    
    def _heartbeat_worker(self):
        """Send periodic heartbeat and status updates"""
        while True:
            try:
                if self.redis_connected and time.time() - self.last_redis_heartbeat > self.heartbeat_interval:
                    status_data = {
                        'status': 'active',
                        'cache_hits': self.inference_cache_hits,
                        'cache_misses': self.inference_cache_misses,
                        'remote_detections_count': len(self.remote_detections)
                    }
                    
                    self.redis_manager.update_device_status(status_data)
                    self.last_redis_heartbeat = time.time()
                    logger.debug(f"💓 Heartbeat sent for {self.device_id}")
                
                time.sleep(10)  # Check every 10 seconds
                
            except Exception as e:
                logger.error(f"Heartbeat worker error: {e}")
                time.sleep(30)  # Wait longer on error
    
    def process_detection_with_redis(self, frame, detections: List[Dict[str, Any]], vm_inference_func) -> List[Dict[str, Any]]:
        """Enhanced detection processing with Redis caching and coordination"""
        
        # Try to get cached inference result first
        cached_result = self._try_inference_cache(frame)
        if cached_result:
            detections = cached_result
            self.inference_cache_hits += 1
            logger.debug(f"🎯 Using cached inference result")
        else:
            # Perform VM inference and cache result
            detections = vm_inference_func(frame)
            self._cache_inference_result(frame, detections)
            self.inference_cache_misses += 1
        
        # Check for weapons in detections
        weapon_detections = self._extract_weapon_detections(detections)
        
        if weapon_detections:
            # Publish detection event to Redis
            self._publish_detection_event(weapon_detections, detections)
            
            # Analyze coordinated response
            coordination_analysis = self._analyze_coordinated_response(weapon_detections)
            
            # Add coordination metadata to detections
            for detection in detections:
                detection['redis_metadata'] = {
                    'coordination_level': coordination_analysis['level'],
                    'cooperating_devices': coordination_analysis['devices'],
                    'total_detecting_devices': coordination_analysis['total_devices'],
                    'cache_performance': {
                        'hits': self.inference_cache_hits,
                        'misses': self.inference_cache_misses,
                        'hit_rate': self._calculate_cache_hit_rate()
                    }
                }
        
        return detections
    
    def _try_inference_cache(self, frame) -> Optional[List[Dict[str, Any]]]:
        """Try to get cached inference result"""
        if not self.redis_connected:
            return None
            
        try:
            # Create frame hash for cache lookup
            _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
            frame_hash = create_frame_hash(buffer.tobytes())
            
            # Check cache
            cached_result = self.redis_manager.get_cached_inference(frame_hash)
            
            if cached_result:
                # Validate cache age (don't use old results)
                cache_age = time.time() - cached_result.get('timestamp', 0)
                if cache_age < 30:  # Use cache results less than 30 seconds old
                    return cached_result.get('detections', [])
            
            return None
            
        except Exception as e:
            logger.error(f"Cache lookup error: {e}")
            return None
    
    def _cache_inference_result(self, frame, detections: List[Dict[str, Any]]):
        """Cache inference result for future use"""
        if not self.redis_connected:
            return
            
        try:
            # Create frame hash
            _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
            frame_hash = create_frame_hash(buffer.tobytes())
            
            # Cache result
            cache_data = {
                'timestamp': time.time(),
                'detections': detections,
                'device_id': self.device_id
            }
            
            self.redis_manager.cache_inference_result(frame_hash, cache_data)
            
        except Exception as e:
            logger.error(f"Cache storage error: {e}")
    
    def _extract_weapon_detections(self, detections: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Extract weapon-related detections"""
        weapon_labels = {"weapon", "pistol", "rifle", "knife"}
        weapon_detections = []
        
        for detection in detections:
            obj_class = detection.get('class', '').strip().lower()
            confidence = detection.get('confidence', 0)
            
            if obj_class in weapon_labels and confidence >= 0.4:
                weapon_detections.append({
                    'class': obj_class,
                    'confidence': confidence,
                    'box': detection.get('box', []),
                    'timestamp': time.time()
                })
        
        return weapon_detections
    
    def _publish_detection_event(self, weapon_detections: List[Dict[str, Any]], all_detections: List[Dict[str, Any]]):
        """Publish detection event to Redis"""
        if not self.redis_connected or not weapon_detections:
            return
            
        try:
            # Calculate detection metadata
            max_confidence = max(det['confidence'] for det in weapon_detections)
            detected_objects = list(set(det['class'] for det in weapon_detections))
            
            detection_event = {
                'objects': detected_objects,
                'max_confidence': max_confidence,
                'detection_count': len(weapon_detections),
                'all_detections': all_detections,
                'coordinates': self.device_config.get('location', 'Unknown'),
                'device_type': self.device_config.get('device_type', 'unknown')
            }
            
            self.redis_manager.publish_detection(detection_event)
            
        except Exception as e:
            logger.error(f"Failed to publish detection event: {e}")
    
    def _analyze_coordinated_response(self, weapon_detections: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze coordination level with other devices"""
        with self.detection_coordination_lock:
            # Count total devices currently detecting
            total_detecting_devices = 1  # This device
            cooperating_devices = []
            
            current_time = time.time()
            
            for device_id, remote_detection in self.remote_detections.items():
                # Only count recent detections (within last 30 seconds)
                if current_time - remote_detection['timestamp'] <= 30:
                    total_detecting_devices += 1
                    cooperating_devices.append({
                        'device_id': device_id,
                        'objects': remote_detection['objects'],
                        'confidence': remote_detection['confidence'],
                        'age': current_time - remote_detection['timestamp']
                    })
            
            # Determine coordination level
            if total_detecting_devices >= 3:
                coordination_level = 'HIGH'  # 3+ devices detecting
            elif total_detecting_devices >= 2:
                coordination_level = 'MEDIUM'  # 2 devices detecting
            else:
                coordination_level = 'LOW'  # Only this device
            
            return {
                'level': coordination_level,
                'devices': cooperating_devices,
                'total_devices': total_detecting_devices,
                'analysis_timestamp': current_time
            }
    
    def _calculate_cache_hit_rate(self) -> float:
        """Calculate cache hit rate percentage"""
        total_requests = self.inference_cache_hits + self.inference_cache_misses
        if total_requests == 0:
            return 0.0
        return (self.inference_cache_hits / total_requests) * 100.0
    
    def get_coordination_status(self) -> Dict[str, Any]:
        """Get current coordination status"""
        with self.detection_coordination_lock:
            return {
                'device_id': self.device_id,
                'redis_connected': self.redis_connected,
                'active_remote_detections': len(self.remote_detections),
                'remote_devices': list(self.remote_detections.keys()),
                'cache_performance': {
                    'hits': self.inference_cache_hits,
                    'misses': self.inference_cache_misses,
                    'hit_rate': self._calculate_cache_hit_rate()
                },
                'last_heartbeat': self.last_redis_heartbeat
            }
    
    def cleanup(self):
        """Clean up Redis resources"""
        try:
            if self.redis_manager:
                self.redis_manager.cleanup()
            logger.info(f"🧹 Redis detection handler cleanup completed for {self.device_id}")
        except Exception as e:
            logger.error(f"Redis detection handler cleanup error: {e}")

# Integration helper functions
def enhance_detection_with_redis(original_process_detections_func):
    """Decorator to enhance existing detection processing with Redis"""
    def wrapper(self, frame, detections):
        # If Redis handler exists, use it
        if hasattr(self, 'redis_handler') and self.redis_handler:
            enhanced_detections = self.redis_handler.process_detection_with_redis(
                frame, detections, lambda f: detections  # Use existing detections
            )
            return original_process_detections_func(self, frame, enhanced_detections)
        else:
            # Fallback to original processing
            return original_process_detections_func(self, frame, detections)
    
    return wrapper