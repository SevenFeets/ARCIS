# Redis Configuration for ARCIS Weapon Detection System
import redis
import json
import time
import logging
from typing import Dict, List, Optional, Any

logger = logging.getLogger(__name__)

# Redis Configuration
REDIS_CONFIG = {
    'host': '34.0.85.5',  # Same as VM host
    'port': 6379,
    'password': None,  # Set if Redis has auth
    'decode_responses': True,
    'socket_connect_timeout': 5,
    'socket_timeout': 5,
    'retry_on_timeout': True,
    'health_check_interval': 30
}

# Redis Key Prefixes
REDIS_KEYS = {
    'detections': 'arcis:detections:',
    'device_status': 'arcis:devices:',
    'inference_cache': 'arcis:cache:inference:',
    'alarms': 'arcis:alarms:',
    'coordinates': 'arcis:coordinates:',
    'system_stats': 'arcis:stats:'
}

# Cache TTL (Time To Live) settings
CACHE_TTL = {
    'inference_result': 30,  # 30 seconds - cache VM inference results
    'detection_event': 60,   # 1 minute - detection events
    'device_status': 120,    # 2 minutes - device heartbeat
    'alarm_state': 300,      # 5 minutes - alarm coordination
    'coordinates': 600       # 10 minutes - GPS coordinates
}

class RedisManager:
    """Redis connection and operation manager for ARCIS system"""
    
    def __init__(self, device_id: str):
        self.device_id = device_id
        self.redis_client = None
        self.connected = False
        self.connection_attempts = 0
        self.max_retries = 5
        
    def connect(self) -> bool:
        """Establish Redis connection with retry logic"""
        try:
            self.redis_client = redis.Redis(**REDIS_CONFIG)
            
            # Test connection
            self.redis_client.ping()
            self.connected = True
            self.connection_attempts = 0
            
            logger.info(f"✅ Redis connected successfully for {self.device_id}")
            self._register_device()
            return True
            
        except redis.ConnectionError as e:
            self.connection_attempts += 1
            self.connected = False
            logger.warning(f"❌ Redis connection failed (attempt {self.connection_attempts}): {e}")
            
            if self.connection_attempts >= self.max_retries:
                logger.error(f"🚫 Redis connection failed after {self.max_retries} attempts - operating without Redis")
            
            return False
            
        except Exception as e:
            logger.error(f"❌ Redis initialization error: {e}")
            self.connected = False
            return False
    
    def _register_device(self):
        """Register this device in Redis"""
        try:
            device_key = f"{REDIS_KEYS['device_status']}{self.device_id}"
            device_info = {
                'device_id': self.device_id,
                'status': 'online',
                'last_seen': time.time(),
                'capabilities': ['weapon_detection', 'alarm_system']
            }
            
            self.redis_client.hset(device_key, mapping=device_info)
            self.redis_client.expire(device_key, CACHE_TTL['device_status'])
            
            logger.info(f"📝 Device {self.device_id} registered in Redis")
            
        except Exception as e:
            logger.error(f"Failed to register device in Redis: {e}")
    
    def publish_detection(self, detection_data: Dict[str, Any]) -> bool:
        """Publish weapon detection event to Redis"""
        if not self.connected:
            return False
            
        try:
            # Create detection event
            event = {
                'device_id': self.device_id,
                'timestamp': time.time(),
                'detection_id': f"{self.device_id}_{int(time.time())}",
                **detection_data
            }
            
            # Publish to detection channel
            channel = f"{REDIS_KEYS['detections']}events"
            self.redis_client.publish(channel, json.dumps(event))
            
            # Store in detection history
            history_key = f"{REDIS_KEYS['detections']}{self.device_id}:history"
            self.redis_client.lpush(history_key, json.dumps(event))
            self.redis_client.ltrim(history_key, 0, 99)  # Keep last 100 detections
            self.redis_client.expire(history_key, CACHE_TTL['detection_event'])
            
            logger.info(f"📡 Published detection event: {event['detection_id']}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to publish detection: {e}")
            return False
    
    def subscribe_to_detections(self, callback_func):
        """Subscribe to detection events from other devices"""
        if not self.connected:
            return None
            
        try:
            pubsub = self.redis_client.pubsub()
            channel = f"{REDIS_KEYS['detections']}events"
            pubsub.subscribe(channel)
            
            logger.info(f"👂 Subscribed to detection events on {channel}")
            
            for message in pubsub.listen():
                if message['type'] == 'message':
                    try:
                        event_data = json.loads(message['data'])
                        # Only process events from other devices
                        if event_data.get('device_id') != self.device_id:
                            callback_func(event_data)
                    except Exception as e:
                        logger.error(f"Error processing detection event: {e}")
                        
            return pubsub
            
        except Exception as e:
            logger.error(f"Failed to subscribe to detections: {e}")
            return None
    
    def cache_inference_result(self, frame_hash: str, inference_result: Dict[str, Any]) -> bool:
        """Cache VM inference result to reduce API calls"""
        if not self.connected:
            return False
            
        try:
            cache_key = f"{REDIS_KEYS['inference_cache']}{frame_hash}"
            cached_data = {
                'timestamp': time.time(),
                'device_id': self.device_id,
                'result': inference_result
            }
            
            self.redis_client.setex(
                cache_key, 
                CACHE_TTL['inference_result'], 
                json.dumps(cached_data)
            )
            
            logger.debug(f"💾 Cached inference result: {frame_hash}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to cache inference result: {e}")
            return False
    
    def get_cached_inference(self, frame_hash: str) -> Optional[Dict[str, Any]]:
        """Retrieve cached inference result"""
        if not self.connected:
            return None
            
        try:
            cache_key = f"{REDIS_KEYS['inference_cache']}{frame_hash}"
            cached_data = self.redis_client.get(cache_key)
            
            if cached_data:
                result = json.loads(cached_data)
                logger.debug(f"🎯 Cache hit for inference: {frame_hash}")
                return result['result']
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to get cached inference: {e}")
            return None
    
    def update_device_status(self, status_data: Dict[str, Any]) -> bool:
        """Update device status and heartbeat"""
        if not self.connected:
            return False
            
        try:
            device_key = f"{REDIS_KEYS['device_status']}{self.device_id}"
            status_update = {
                'last_seen': time.time(),
                **status_data
            }
            
            self.redis_client.hset(device_key, mapping=status_update)
            self.redis_client.expire(device_key, CACHE_TTL['device_status'])
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to update device status: {e}")
            return False
    
    def get_all_devices(self) -> List[Dict[str, Any]]:
        """Get status of all registered devices"""
        if not self.connected:
            return []
            
        try:
            device_pattern = f"{REDIS_KEYS['device_status']}*"
            device_keys = self.redis_client.keys(device_pattern)
            
            devices = []
            for key in device_keys:
                device_data = self.redis_client.hgetall(key)
                if device_data:
                    devices.append(device_data)
            
            return devices
            
        except Exception as e:
            logger.error(f"Failed to get device list: {e}")
            return []
    
    def publish_alarm_state(self, alarm_code: str, source_device: str = None) -> bool:
        """Publish alarm state change"""
        if not self.connected:
            return False
            
        try:
            alarm_event = {
                'device_id': self.device_id,
                'alarm_code': alarm_code,
                'source_device': source_device or self.device_id,
                'timestamp': time.time()
            }
            
            channel = f"{REDIS_KEYS['alarms']}state"
            self.redis_client.publish(channel, json.dumps(alarm_event))
            
            # Store current alarm state
            state_key = f"{REDIS_KEYS['alarms']}current"
            self.redis_client.setex(state_key, CACHE_TTL['alarm_state'], json.dumps(alarm_event))
            
            logger.info(f"🚨 Published alarm state: {alarm_code}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to publish alarm state: {e}")
            return False
    
    def get_system_stats(self) -> Dict[str, Any]:
        """Get overall system statistics"""
        if not self.connected:
            return {}
            
        try:
            stats = {
                'active_devices': len(self.get_all_devices()),
                'redis_info': self.redis_client.info('memory'),
                'total_detections': 0,
                'cache_hits': 0,
                'timestamp': time.time()
            }
            
            # Count total detections across all devices
            detection_pattern = f"{REDIS_KEYS['detections']}*:history"
            detection_keys = self.redis_client.keys(detection_pattern)
            
            for key in detection_keys:
                count = self.redis_client.llen(key)
                stats['total_detections'] += count
            
            return stats
            
        except Exception as e:
            logger.error(f"Failed to get system stats: {e}")
            return {}
    
    def cleanup(self):
        """Clean up Redis connections"""
        try:
            if self.connected and self.redis_client:
                # Remove device from active list
                device_key = f"{REDIS_KEYS['device_status']}{self.device_id}"
                self.redis_client.delete(device_key)
                
                # Close connection
                self.redis_client.close()
                logger.info(f"🧹 Redis cleanup completed for {self.device_id}")
                
        except Exception as e:
            logger.error(f"Redis cleanup error: {e}")
        finally:
            self.connected = False
            self.redis_client = None

# Utility functions
def create_frame_hash(frame_data: bytes) -> str:
    """Create hash of frame data for caching"""
    import hashlib
    return hashlib.md5(frame_data).hexdigest()

def get_redis_manager(device_id: str) -> RedisManager:
    """Factory function to create RedisManager instance"""
    return RedisManager(device_id)