import cv2
import requests
import numpy as np
import threading
import time
import pygame
import json
from queue import Queue, Empty
import logging
from collections import deque
import base64
from io import BytesIO
import os
import socketio
import platform

# Redis integration for enhanced coordination
try:
    from redis_system.redis_config import RedisManager
    from redis_system.redis_detection_handler import RedisDetectionHandler
    REDIS_AVAILABLE = True
    print("✅ Redis integration available")
except ImportError:
    REDIS_AVAILABLE = False
    print("⚠️ Redis not available - using basic WebSocket coordination")

# Try to import Google Vision, fallback to VM inference if not available
try:
    from google.cloud import vision
    GOOGLE_VISION_AVAILABLE = True
    print("✅ Google Cloud Vision SDK available")
except ImportError:
    GOOGLE_VISION_AVAILABLE = False
    print("⚠️ Google Cloud Vision SDK not installed - using VM inference (recommended)")

# Configuration
ARCIS_API_URL = "https://arcis-production.up.railway.app/api/detections/upload-jpeg"
ARCIS_API_KEY = "test-device-key-2024"

# VM Configuration (primary method - VM has Google Vision set up)
VM_IP = "34.0.85.5"
VM_PORT = 8000
INFERENCE_URL = f"http://{VM_IP}:{VM_PORT}/infer"
WEBSOCKET_URL = f"http://{VM_IP}:{VM_PORT}"

# Device Detection and Configuration
def detect_device_type():
    """Detect if running on Pi4 or Jetson"""
    try:
        # Check for Jetson-specific files
        if os.path.exists('/etc/nv_tegra_release'):
            return 'jetson'
        # Check for Pi-specific files
        elif os.path.exists('/proc/device-tree/model'):
            with open('/proc/device-tree/model', 'r') as f:
                model = f.read().lower()
                if 'raspberry pi' in model:
                    return 'pi4'
        # Fallback to platform detection
        elif platform.machine().startswith('aarch64'):
            return 'jetson'  # Likely Jetson
        else:
            return 'pi4'  # Default assumption
    except:
        return 'pi4'  # Default fallback

DEVICE_TYPE = detect_device_type()

# Device-specific configurations
DEVICE_CONFIGS = {
    'pi4': {
        'device_id': 'pi4_c',
        'device_name': 'pi4',
        'device_type': 'raspberry_pi',
        'device_model': 'Raspberry Pi 4 Model B',
        'location': 'Security Checkpoint Charlie',
        'alarm_path': './alarm.mp3',  # Relative path to current directory
        'api_key': 'secretkey1'  # Use same API key as Jetson for now
    },
    'jetson': {
        'device_id': 'jetson1',
        'device_name': 'jetson',
        'device_type': 'jetson_nano',
        'device_model': 'Jetson Nano',
        'location': 'Security Checkpoint Delta',
        'alarm_path': './alarm.mp3',  # Relative path to current directory
        'api_key': 'secretkey1'
    }
}

# Multi-device alarm paths - like working send_frames2.py
ALARM_ME = "./Alarm_ME.mp3"
ALARM_OTHER = "./Alarm_OTHER.mp3" 
ALARM_BOTH = "./Alarm_BOTH.mp3"

# Get current device config
DEVICE_CONFIG = DEVICE_CONFIGS[DEVICE_TYPE]

# Smart Detection Configuration - RESTORED TO ORIGINAL WORKING LOGIC
SMART_CONFIG = {
    'enabled': True,
    'frame_buffer_size': 30,
    'middle_frame_position': 15,
    'min_confidence': 0.5,
    # Restore original detection threshold that worked
    'detection_threshold': 0.7,  # 70% detection rate required (original working value)
    'alarm_cooldown_seconds': 1.0,
    'max_alarm_duration': 30.0
}

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class SmartDetectionTracker:
    """Implements Smart Detection Rules for 1.5 second steady detection uploads"""
    
    def __init__(self, device_id, buffer_size=30, middle_position=15):
        self.device_id = device_id
        self.buffer_size = buffer_size
        self.middle_position = middle_position
        
        # Smart Detection State
        self.frame_buffer = deque(maxlen=buffer_size)
        self.detection_buffer = deque(maxlen=buffer_size)
        self.current_objects = set()
        self.frames_since_detection_start = 0
        self.has_sent_initial_frame = False
        self.upload_sequence = 0
        
        # FIXED: Use same buffer size as frame_buffer for proper synchronization
        self.detection_window = deque(maxlen=buffer_size)  # Track last 30 detections (same as frame buffer)
        self.detection_threshold = 0.7  # 70% of frames must have detection
        self.last_object_set = set()
        self.consistent_frames = 0
        
        # NEW: Time-based detection tracking
        self.detection_start_time = None
        self.steady_detection_duration = 1.0  # 1.0 seconds of steady detection required (more responsive)
        self.last_detection_time = None
        self.detection_history = deque(maxlen=30)  # Track 1.0 seconds at 30 FPS
        
        logger.info(f"🧠 Smart Detection initialized for {device_id}")
        logger.info(f"📊 Buffer: {buffer_size} frames, Upload: {middle_position}th frame")
        logger.info(f"🎯 Tolerance: {self.detection_threshold*100:.0f}% detection rate required")
        logger.info(f"⏱️ Steady detection duration: {self.steady_detection_duration} seconds (60% threshold)")

    def process_frame(self, frame, detections):
        """Process new frame and detections using Smart Detection Rules"""
        
        # Add frame and detections to buffers
        self.frame_buffer.append(frame.copy())
        self.detection_buffer.append(detections)
        
        # Extract current objects from detections
        detected_objects = set()
        for detection in detections:
            obj_class = detection.get('class', '').strip().lower()
            if obj_class in {'weapon', 'pistol', 'rifle', 'knife'}:
                detected_objects.add(obj_class)
        
        # Add to sliding window (True if objects detected, False if not)
        self.detection_window.append(detected_objects if detected_objects else set())
        
        # NEW: Add to time-based detection history
        current_time = time.time()
        detection_entry = {
            'time': current_time,
            'objects': detected_objects,
            'frame': frame.copy()
        }
        self.detection_history.append(detection_entry)
        
        # Apply Smart Detection Rules with time-based logic
        upload_decision = self._apply_time_based_smart_rules(detected_objects, current_time)
        
        if upload_decision['should_upload']:
            return self._prepare_upload_data(upload_decision)
        
        return None
    
    def _apply_smart_rules_with_tolerance(self, detected_objects):
        """Apply Smart Detection Rules - RESTORED TO ORIGINAL WORKING LOGIC"""
        
        upload_decision = {
            'should_upload': False,
            'reason': '',
            'frame_position': 0,
            'objects': detected_objects
        }
        
        # Calculate detection statistics from sliding window
        if len(self.detection_window) < self.middle_position:
            # Not enough frames yet
            if detected_objects:
                logger.info(f"[{self.device_id}] 🔄 Buffering... ({len(self.detection_window)}/{self.middle_position})")
            return upload_decision
        
        # Analyze the sliding window
        object_counts = {}
        total_frames = len(self.detection_window)
        frames_with_detection = 0
        
        for frame_objects in self.detection_window:
            if frame_objects:  # If any objects detected in this frame
                frames_with_detection += 1
                for obj in frame_objects:
                    object_counts[obj] = object_counts.get(obj, 0) + 1
        
        # Find dominant objects (present in >70% of frames) - ORIGINAL WORKING LOGIC
        dominant_objects = set()
        for obj, count in object_counts.items():
            detection_rate = count / total_frames
            if detection_rate >= self.detection_threshold:  # Use instance threshold
                dominant_objects.add(obj)
        
        # Calculate overall detection rate
        overall_detection_rate = frames_with_detection / total_frames
        
        # ORIGINAL WORKING SMART DETECTION LOGIC
        
        # Rule 1: New Dominant Objects Detected
        if dominant_objects and dominant_objects != self.current_objects:
            if not self.current_objects:
                # First time detecting these objects
                logger.info(f"[{self.device_id}] 🆕 NEW detection: {dominant_objects} ({overall_detection_rate*100:.0f}% rate)")
                self.current_objects = dominant_objects.copy()
                self.consistent_frames = 1
            else:
                # Objects changed
                new_objects = dominant_objects - self.current_objects
                if new_objects:
                    logger.info(f"[{self.device_id}] ➕ NEW objects: {new_objects} (added to {self.current_objects})")
                else:
                    logger.info(f"[{self.device_id}] 🔄 Objects changed: {self.current_objects} → {dominant_objects}")
                
                self.current_objects = dominant_objects.copy()
                self.consistent_frames = 1
                
                # Upload immediately for object changes
                if not self.has_sent_initial_frame:
                    self.upload_sequence += 1
                    self.has_sent_initial_frame = True
                    
                    upload_decision.update({
                        'should_upload': True,
                        'reason': f'dominant_objects_detected_{overall_detection_rate*100:.0f}%',
                        'frame_position': f"{len(self.detection_window)}/{self.buffer_size}",
                    })
        
        # Rule 2: Consistent Detection - Upload the 15th frame when buffer is full
        elif dominant_objects == self.current_objects and dominant_objects:
            self.consistent_frames += 1
            
            # FIXED: Upload when we have enough frames and haven't sent initial frame
            if len(self.frame_buffer) >= self.middle_position and not self.has_sent_initial_frame:
                logger.info(f"[{self.device_id}] 📤 15th frame upload: {dominant_objects} ({overall_detection_rate*100:.0f}% rate)")
                self.has_sent_initial_frame = True
                self.upload_sequence += 1
                
                upload_decision.update({
                    'should_upload': True,
                    'reason': f'consistent_detection_{overall_detection_rate*100:.0f}%',
                    'frame_position': f"{self.middle_position}/{self.buffer_size}",
                })
        
        # Rule 3: Complete Loss of Detection
        elif not dominant_objects and self.current_objects:
            logger.info(f"[{self.device_id}] 🔄 Lost detection: {self.current_objects} ({overall_detection_rate*100:.0f}% rate)")
            self.current_objects = set()
            self.consistent_frames = 0
            self.has_sent_initial_frame = False
        
        return upload_decision
    
    def _apply_time_based_smart_rules(self, detected_objects, current_time):
        """Apply Smart Detection Rules with 1.5 second steady detection requirement"""
        
        upload_decision = {
            'should_upload': False,
            'reason': '',
            'frame_position': 0,
            'objects': detected_objects
        }
        
        # Case 1: No objects detected
        if not detected_objects:
            if self.current_objects:
                logger.info(f"[{self.device_id}] 🔄 Lost detection: {self.current_objects}")
                self._reset_detection_state()
            return upload_decision
        
        # Case 2: First detection or new objects
        if not self.current_objects:
            # First time detecting these objects
            logger.info(f"[{self.device_id}] 🆕 NEW detection started: {detected_objects}")
            self._start_new_detection(detected_objects, current_time)
            return upload_decision
        elif detected_objects != self.current_objects:
            # Objects changed - check if new objects were added
            new_objects = detected_objects - self.current_objects
            if new_objects:
                logger.info(f"[{self.device_id}] ➕ NEW objects: {new_objects} (added to {self.current_objects})")
                # Upload for new objects
                self._start_new_detection(detected_objects, current_time)
                upload_decision.update({
                    'should_upload': True,
                    'reason': f'new_objects_added_{list(new_objects)}',
                    'frame_position': 'new_objects',
                })
            else:
                logger.info(f"[{self.device_id}] 🔄 Objects changed: {self.current_objects} → {detected_objects}")
                self._start_new_detection(detected_objects, current_time)
            return upload_decision
        
        # Case 3: Same objects - only upload once per detection session
        if detected_objects == self.current_objects:
            self.last_detection_time = current_time
            
            # Only upload if we haven't sent initial frame yet
            if not self.has_sent_initial_frame:
                # Wait for steady detection confirmation (more robust)
                if self._check_steady_detection(detected_objects, current_time):
                    logger.info(f"[{self.device_id}] 📤 Steady detection confirmed - uploading: {detected_objects}")
                    self.has_sent_initial_frame = True
                    self.upload_sequence += 1
                    
                    upload_decision.update({
                        'should_upload': True,
                        'reason': f'steady_detection_confirmed_{detected_objects}',
                        'frame_position': 'steady_detection',
                    })
        
        return upload_decision
    
    def _check_steady_detection(self, target_objects, current_time):
        """Check if objects have been steadily detected for the required duration"""
        
        # Look back 1.5 seconds in detection history
        cutoff_time = current_time - self.steady_detection_duration
        recent_detections = [
            entry for entry in self.detection_history 
            if entry['time'] >= cutoff_time
        ]
        
        if len(recent_detections) < 3:  # Need at least 3 frames for analysis
            return False
        
        # Count frames with target objects detected
        frames_with_target = 0
        total_frames = len(recent_detections)
        
        for entry in recent_detections:
            if entry['objects'] == target_objects:
                frames_with_target += 1
        
        # Calculate detection rate over the time period
        detection_rate = frames_with_target / total_frames
        
        # Require 60% detection rate over 1.0 seconds for more stable detection
        steady_detected = detection_rate >= 0.6
        
        if steady_detected:
            logger.info(f"[{self.device_id}] ✅ Steady detection confirmed: {detection_rate*100:.1f}% over {self.steady_detection_duration}s")
        else:
            logger.info(f"[{self.device_id}] ⏳ Detection rate: {detection_rate*100:.1f}% (need 60%)")
        
        return steady_detected
    
    def _start_new_detection(self, objects, current_time):
        """Start tracking a new detection sequence"""
        self.current_objects = objects.copy()
        self.detection_start_time = current_time
        self.last_detection_time = current_time
        self.has_sent_initial_frame = False
    
    def _reset_detection_state(self):
        """Reset when no objects detected"""
        self.current_objects = set()
        self.detection_start_time = None
        self.last_detection_time = None
        self.has_sent_initial_frame = False
    
    def _prepare_upload_data(self, upload_decision):
        """Prepare frame and metadata for ARCIS upload"""
        
        # Use the most recent frame from detection history (current frame)
        if not self.detection_history:
            return None
        
        # Get the most recent detection entry
        latest_entry = self.detection_history[-1]
        upload_frame = latest_entry['frame']
        
        # Get the current detections
        frame_detections = []
        for detection in self.detection_buffer[-1] if self.detection_buffer else []:
            frame_detections.append(detection)
        
        # Prepare metadata
        metadata = {
            'device_id': self.device_id,
            'device_name': DEVICE_CONFIG['device_name'],
            'device_type': DEVICE_CONFIG['device_type'],
            'device_model': DEVICE_CONFIG['device_model'],
            'location': DEVICE_CONFIG['location'],
            'upload_method': 'smart_detection_time_based',
            'upload_reason': upload_decision['reason'],
            'frame_position': upload_decision['frame_position'],
            'smart_upload_sequence': self.upload_sequence,
            'total_objects_in_frame': len(upload_decision['objects']),
            'objects_detected': list(upload_decision['objects']),
            'smart_detection': True,
            'steady_detection_duration': self.steady_detection_duration,
            'google_vision_detections': frame_detections
        }
        
        logger.info(f"[{self.device_id}] 📊 UPLOAD #{self.upload_sequence} - {list(upload_decision['objects'])} - {upload_decision['reason']}")
        
        return {
            'frame': upload_frame,
            'metadata': metadata,
            'detections': frame_detections,
            'objects': upload_decision['objects']
        }

class WeaponDetectionClient:
    def __init__(self):
        self.cap = None
        self.running = False
        self.weapon_detected = False
        self.alarm_playing = False
        self.current_alarm_code = None
        self.websocket_connected = False

        # Add cooldown timer for alarm system like working send_frames2.py
        self.alarm_cooldown_start = None
        self.alarm_cooldown_duration = 2.0  # 2 seconds cooldown before stopping alarm

        # Initialize Google Cloud Vision
        self.vision_client = None
        self._initialize_vision_client()

        # Simple detection state tracking (like send_frames2.py)
        self.current_detected_objects = set()
        self.upload_sent_for_current_objects = False

        # Initialize pygame mixer for audio
        try:
            pygame.mixer.init()
            logger.info("Audio system initialized")
            
            # Test alarm file availability
            alarm_files = ['./alarm.mp3', './Alarm_ME.mp3', './Alarm_OTHER.mp3', './Alarm_BOTH.mp3']
            found_alarms = []
            for alarm_file in alarm_files:
                if os.path.exists(alarm_file):
                    found_alarms.append(alarm_file)
            
            if found_alarms:
                logger.info(f"✅ Found alarm files: {found_alarms}")
            else:
                logger.warning("⚠️ No alarm files found in current directory")
                
        except Exception as e:
            logger.error(f"Failed to initialize audio: {e}")

        # Thread-safe queues
        self.frame_queue = Queue(maxsize=2)
        self.upload_queue = Queue()
        self.detection_lock = threading.Lock()

        # Performance tracking
        self.last_detection_time = 0
        self.fps_counter = 0
        self.fps_start_time = time.time()
        self.upload_count = 0
        
        # Detection cache for display
        self.last_detections = []

        # Initialize WebSocket client
        self.sio = socketio.Client(logger=False, engineio_logger=False)
        self.setup_websocket_handlers()
        
        # Initialize Redis for enhanced coordination
        self.redis_handler = None
        if REDIS_AVAILABLE:
            try:
                self.redis_handler = RedisDetectionHandler(DEVICE_CONFIG['device_id'], DEVICE_CONFIG)
                logger.info(f"✅ Redis coordination enabled for {DEVICE_CONFIG['device_id']}")
            except Exception as e:
                logger.warning(f"⚠️ Redis initialization failed: {e} - using WebSocket only")
                self.redis_handler = None
        else:
            logger.info("📡 Using WebSocket-only coordination (Redis not available)")

    def setup_websocket_handlers(self):
        @self.sio.event
        def connect():
            logger.info("WebSocket connected to server")
            self.websocket_connected = True
            # Register this client with the server - like working send_frames2.py
            self.sio.emit('register_client', {
                'client_id': DEVICE_CONFIG['device_id'],
                'api_key': DEVICE_CONFIG['api_key']
            })

        @self.sio.event
        def disconnect():
            logger.info("WebSocket disconnected from server")
            self.websocket_connected = False

        @self.sio.event
        def registration_success(data):
            logger.info(f"Successfully registered as {data['client_id']}")

        @self.sio.event
        def registration_failed(data):
            logger.error(f"Registration failed: {data['error']}")

        @self.sio.event
        def alarm_command(data):
            """Handle alarm commands from server - RE-ENABLED for synchronization"""
            try:
                my_alarm_code = data.get(DEVICE_CONFIG['device_id'], 'NONE')
                timestamp = data.get('timestamp', '')
                
                logger.info(f"[{DEVICE_CONFIG['device_id']}] Received alarm command: {my_alarm_code} at {timestamp}")
                
                with self.detection_lock:
                    self.handle_alarm_code(my_alarm_code)
                    
            except Exception as e:
                logger.error(f"Error handling alarm command: {e}")

        @self.sio.event
        def weapon_detected(data):
            """Handle weapon detection from other devices - like working send_frames2.py"""
            try:
                other_device_id = data.get('device_id', '')
                if other_device_id != DEVICE_CONFIG['device_id']:
                    logger.info(f"🚨 Other device {other_device_id} detected weapon - playing OTHER alarm")
                    self.current_alarm_code = 'OTHER'  # Update alarm code for display
                    threading.Thread(target=self.play_alarm, args=(ALARM_OTHER,), daemon=True).start()
                    
            except Exception as e:
                logger.error(f"Error handling weapon detection from other device: {e}")

        @self.sio.event
        def weapon_lost(data):
            """Handle weapon loss from other devices - like working send_frames2.py"""
            try:
                other_device_id = data.get('device_id', '')
                if other_device_id != DEVICE_CONFIG['device_id']:
                    logger.info(f"🔇 Other device {other_device_id} lost weapon")
                    # Only stop alarm if this device isn't detecting anything
                    if not self.weapon_detected:
                        self.current_alarm_code = 'NONE'  # Update alarm code for display
                        self.stop_alarm()
                        
            except Exception as e:
                logger.error(f"Error handling weapon loss from other device: {e}")

    def connect_websocket(self):
        """Connect to WebSocket server"""
        max_retries = 5
        retry_delay = 2
        
        for attempt in range(max_retries):
            try:
                logger.info(f"Attempting WebSocket connection (attempt {attempt + 1}/{max_retries})")
                self.sio.connect(WEBSOCKET_URL, wait_timeout=10)
                return True
            except Exception as e:
                logger.warning(f"WebSocket connection failed: {e}")
                if attempt < max_retries - 1:
                    time.sleep(retry_delay)
                    retry_delay *= 2
                
        logger.error("Failed to establish WebSocket connection after all retries")
        return False

    def handle_alarm_code(self, alarm_code):
        """Handle alarm code received from server - like working send_frames2.py"""
        if alarm_code == self.current_alarm_code:
            return

        logger.info(f"Alarm code changed: {self.current_alarm_code} -> {alarm_code}")
        self.current_alarm_code = alarm_code
        
        if alarm_code == 'ME':
            self.play_alarm(ALARM_ME)
        elif alarm_code == 'OTHER':
            self.play_alarm(ALARM_OTHER)
        elif alarm_code == 'BOTH':
            self.play_alarm(ALARM_BOTH)
        else:  # 'NONE'
            self.stop_alarm()

    def _initialize_vision_client(self):
        """Initialize Google Cloud Vision client (optional)"""
        if not GOOGLE_VISION_AVAILABLE:
            logger.info("📱 Using VM inference (VM has Google Vision) - No local setup needed")
            self.vision_client = None
            return
            
        try:
            # Only try if Google Vision SDK is available and credentials are set
            self.vision_client = vision.ImageAnnotatorClient()
            logger.info("✅ Google Cloud Vision SDK client initialized")
            
        except Exception as e:
            logger.info(f"📱 Google Vision SDK setup issue: {e}")
            logger.info("📱 Will use VM inference (recommended method)")
            self.vision_client = None

    def detect_objects_with_vm(self, frame):
        """Enhanced VM inference with Redis caching"""
        try:
            # Try Redis cache first if available
            if self.redis_handler:
                cached_result = self.redis_handler._try_inference_cache(frame)
                if cached_result:
                    logger.debug("🎯 Using cached inference result from Redis")
                    return cached_result
            
            # Perform VM inference
            _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
            files = {'image': ('frame.jpg', buffer.tobytes(), 'image/jpeg')}
            headers = {'X-API-Key': DEVICE_CONFIG['api_key']}
            response = requests.post(INFERENCE_URL, files=files, headers=headers, timeout=2.0)

            if response.status_code == 200:
                result = response.json()
                detections = result.get('detections', [])
                
                # Convert VM format to our standard format
                formatted_detections = []
                for det in detections:
                    formatted_det = {
                        'class': det.get('class', '').lower(),
                        'confidence': det.get('confidence', 0.0),
                        'box': det.get('box', [0, 0, 100, 100]),
                        'description': det.get('class', ''),
                        'source': 'vm_google_vision'
                    }
                    formatted_detections.append(formatted_det)
                
                # Cache result in Redis if available
                if self.redis_handler:
                    self.redis_handler._cache_inference_result(frame, formatted_detections)
                
                return formatted_detections

        except requests.exceptions.Timeout:
            logger.warning("VM inference request timed out")
        except requests.exceptions.RequestException as e:
            logger.warning(f"VM network error: {e}")
        except Exception as e:
            logger.error(f"VM inference error: {e}")

        return []

    def detect_objects_with_vision(self, frame):
        """Send frame to Google Vision API for object detection"""
        try:
            if not self.vision_client:
                return []

            # Convert frame to JPEG
            _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
            image_bytes = buffer.tobytes()

            # Create Vision API image object
            image = vision.Image(content=image_bytes)

            # Perform object localization
            response = self.vision_client.object_localization(image=image)
            objects = response.localized_object_annotations

            detections = []
            for obj in objects:
                # Extract bounding box coordinates
                vertices = obj.bounding_poly.normalized_vertices
                x_coords = [v.x for v in vertices]
                y_coords = [v.y for v in vertices]
                
                # Convert normalized coordinates to pixel coordinates
                h, w = frame.shape[:2]
                x1 = int(min(x_coords) * w)
                y1 = int(min(y_coords) * h)
                x2 = int(max(x_coords) * w)
                y2 = int(max(y_coords) * h)

                detection = {
                    'class': obj.name.lower(),
                    'confidence': obj.score,
                    'box': [x1, y1, x2, y2],
                    'description': obj.name,
                    'boundingPoly': {
                        'vertices': [{'x': int(v.x * w), 'y': int(v.y * h)} for v in vertices]
                    }
                }
                
                detections.append(detection)

            return detections

        except Exception as e:
            logger.error(f"Google Vision API error: {e}")
            return []

    def initialize_camera(self, camera_id=0):
        try:
            self.cap = cv2.VideoCapture(camera_id)
            if not self.cap.isOpened():
                raise Exception(f"Cannot open camera {camera_id}")

            self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
            self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
            self.cap.set(cv2.CAP_PROP_FPS, 30)
            self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

            ret, frame = self.cap.read()
            if not ret:
                raise Exception("Cannot read from camera")

            logger.info(f"Camera initialized: {frame.shape}")
            return True

        except Exception as e:
            logger.error(f"Camera initialization failed: {e}")
            return False

    def upload_to_arcis(self, upload_data):
        """Upload detection data to ARCIS with simplified logic"""
        try:
            frame = upload_data['frame']
            detections = upload_data['detections']
            objects = upload_data['objects']
            reason = upload_data['reason']

            # Convert frame to JPEG bytes (high quality like test script)
            _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 90])
            jpeg_bytes = buffer.tobytes()

            logger.info(f"🔧 Uploading frame: {len(jpeg_bytes)} bytes ({len(jpeg_bytes)/1024:.1f}KB)")

            # Select primary object for upload
            primary_object = list(objects)[0] if objects else 'weapon'
            
            # Map object names to ARCIS format (EXACT mapping from test script)
            object_mapping = {
                'weapon': 'weapon',
                'pistol': 'Pistol', 
                'rifle': 'rifle',
                'knife': 'Knife'
            }
            
            arcis_object_type = object_mapping.get(primary_object, 'weapon')

            # Calculate threat level based on object type (EXACT from test script)
            threat_levels = {
                'rifle': 8,
                'weapon': 7,
                'Pistol': 6,
                'Knife': 5
            }
            base_threat = threat_levels.get(arcis_object_type, 6)
            
            # Get highest confidence from detections
            max_confidence = 0.85
            for det in detections:
                if det.get('class', '').lower() in objects:
                    max_confidence = max(max_confidence, det.get('confidence', 0.85))

            # Calculate bounding box from detections
            bounding_box = {
                'x': 80 + int(np.random.random() * 60),
                'y': 120 + int(np.random.random() * 60),
                'width': 100 + int(np.random.random() * 40),
                'height': 150 + int(np.random.random() * 50)
            }
            
            if detections:
                for det in detections:
                    if det.get('class', '').lower() == primary_object:
                        box = det.get('box', [80, 120, 180, 270])
                        bounding_box = {
                            'x': int(box[0]),
                            'y': int(box[1]), 
                            'width': int(box[2] - box[0]),
                            'height': int(box[3] - box[1])
                        }
                        break

            # System metrics (EXACT format from test script)
            system_metrics = {
                'device_type': DEVICE_CONFIG['device_type'],
                'device_id': DEVICE_CONFIG['device_id'],
                'device_name': DEVICE_CONFIG['device_name'],
                'cpu_usage': 35 + np.random.random() * 20,
                'memory_usage': 45 + np.random.random() * 25,
                'temperature': 55 + np.random.random() * 15,
                'voltage': 5.1 + np.random.random() * 0.2,
                'network_strength': 80 + np.random.random() * 15
            }

            # Simple metadata 
            upload_metadata = {
                'device_id': DEVICE_CONFIG['device_id'],
                'device_name': DEVICE_CONFIG['device_name'],
                'device_type': DEVICE_CONFIG['device_type'],
                'device_model': DEVICE_CONFIG['device_model'],
                'location': DEVICE_CONFIG['location'],
                'upload_method': 'simple_detection',
                'image_format': 'full_resolution_jpeg',
                'upload_reason': reason,
                'detected_objects': list(objects)
            }

            # Prepare the multipart form data (EXACT format from test script)
            files = {
                'detection_frame': (f"{DEVICE_CONFIG['device_id']}_detection.jpg", jpeg_bytes, 'image/jpeg')
            }

            # Form data (EXACT field names and formats from test script)
            form_data = {
                'object_type': arcis_object_type,
                'confidence': f"{max_confidence:.3f}",
                'threat_level': str(base_threat),
                'device_id': DEVICE_CONFIG['device_id'],
                'device_name': DEVICE_CONFIG['device_name'],
                'device_type': DEVICE_CONFIG['device_type'],
                'bounding_box': json.dumps(bounding_box),
                'system_metrics': json.dumps(system_metrics),
                'metadata': json.dumps(upload_metadata),
                'timestamp': time.strftime('%Y-%m-%dT%H:%M:%S.000Z')
            }

            # Headers (EXACT from test script)
            headers = {
                'X-API-Key': ARCIS_API_KEY
            }

            logger.info(f"🚀 Uploading to ARCIS: {arcis_object_type} (confidence: {max_confidence:.3f})")
            logger.info(f"📡 Endpoint: {ARCIS_API_URL}")
            logger.info(f"🔧 Device: {DEVICE_CONFIG['device_id']} ({upload_metadata['upload_method']})")

            # Make request to ARCIS (EXACT method from test script)
            response = requests.post(
                ARCIS_API_URL,
                files=files,
                data=form_data,
                headers=headers,
                timeout=15
            )

            logger.info(f"📤 Response status: {response.status_code}")

            if response.status_code == 200:
                result = response.json()
                detection_id = result.get('data', {}).get('detection_id', 'unknown')
                self.upload_count += 1
                
                logger.info(f"✅ ARCIS Upload successful: ID {detection_id}")
                logger.info(f"📊 Upload #{self.upload_count} - {arcis_object_type} - {reason}")
                logger.info(f"🎯 Threat Level: {base_threat} | Confidence: {max_confidence:.3f}")
                return True
            else:
                logger.error(f"❌ ARCIS Upload failed: {response.status_code}")
                logger.error(f"Response: {response.text[:300]}")
                return False

        except Exception as e:
            logger.error(f"❌ ARCIS upload error: {e}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            return False

    def play_alarm(self, alarm_path):
        """Play alarm - like working send_frames2.py"""
        try:
            if not pygame.mixer.get_init():
                return

            if pygame.mixer.music.get_busy():
                pygame.mixer.music.stop()

            pygame.mixer.music.load(alarm_path)
            pygame.mixer.music.play(-1)  # Loop indefinitely
            self.alarm_playing = True
            logger.info(f"🚨 Playing alarm: {alarm_path}")

        except Exception as e:
            logger.error(f"Failed to play alarm: {e}")

    def stop_alarm(self):
        """Stop alarm with improved handling"""
        try:
            if self.alarm_playing:
                if pygame.mixer.get_init() and pygame.mixer.music.get_busy():
                    pygame.mixer.music.stop()
                self.alarm_playing = False
                logger.info("🔇 Alarm stopped")
        except Exception as e:
            logger.error(f"Failed to stop alarm: {e}")
            self.alarm_playing = False

    def check_alarm_cooldown(self):
        """Check if cooldown period has expired and stop alarm if needed"""
        if self.alarm_cooldown_start is not None:
            current_time = time.time()
            if current_time - self.alarm_cooldown_start >= self.alarm_cooldown_duration:
                logger.info(f"[{DEVICE_CONFIG['device_id']}] ⏰ Cooldown expired - stopping alarm")
                self.stop_alarm()
                self.current_alarm_code = 'NONE'  # Update alarm code after cooldown
                self.alarm_cooldown_start = None

    def process_detections(self, frame, detections):
        """Enhanced detection processing with Redis coordination and caching"""
        
        # Redis-enhanced detection processing if available
        if self.redis_handler:
            try:
                # Use Redis handler for enhanced processing
                enhanced_detections = self.redis_handler.process_detection_with_redis(
                    frame, detections, lambda f: detections
                )
                detections = enhanced_detections
                
                # Get coordination status for logging
                coord_status = self.redis_handler.get_coordination_status()
                if coord_status['active_remote_detections'] > 0:
                    logger.debug(f"🤝 Coordination: {coord_status['active_remote_detections']} remote devices active")
                
            except Exception as e:
                logger.error(f"Redis processing error: {e} - falling back to standard processing")
        
        # Cache detections for display
        self.last_detections = detections.copy()
        
        # Check for weapons with higher confidence threshold for uploads
        weapon_labels = {"weapon", "pistol", "rifle", "knife"}
        
        # Extract current detected objects with STRICT confidence for uploads
        current_objects = set()
        high_confidence_objects = set()
        
        for det in detections:
            obj_class = det.get("class", "").strip().lower()
            confidence = det.get("confidence", 0)
            
            # Lower threshold for alarms/display (40%)
            if obj_class in weapon_labels and confidence >= 0.4:
                current_objects.add(obj_class)
            
            # HIGHER threshold for uploads (70% - prevent false positive uploads)
            if obj_class in weapon_labels and confidence >= 0.7:
                high_confidence_objects.add(obj_class)
        
        weapon_found = len(current_objects) > 0
        high_confidence_weapon_found = len(high_confidence_objects) > 0

        # WebSocket notification logic (like send_frames2.py)
        with self.detection_lock:
            previous_state = self.weapon_detected
            self.weapon_detected = weapon_found
            current_time = time.time()

            if weapon_found and not previous_state:
                # This device detected weapon - notify server (let server control alarms)
                logger.info(f"[{DEVICE_CONFIG['device_id']}] 🚨 Local weapon detection - notifying server")
                
                # Notify other devices via WebSocket - let SERVER control alarms
                if self.websocket_connected:
                    try:
                        self.sio.emit('weapon_detected', {
                            'device_id': DEVICE_CONFIG['device_id'],
                            'timestamp': time.time(),
                            'objects': list(self.last_detections)
                        })
                        logger.info(f"[{DEVICE_CONFIG['device_id']}] 📡 Notified server of weapon detection")
                    except Exception as e:
                        logger.error(f"Failed to notify server: {e}")
                        
            elif not weapon_found and previous_state:
                # Weapon lost - notify server and reset upload state
                logger.info(f"[{DEVICE_CONFIG['device_id']}] 🔇 Weapon lost - notifying server")
                
                # Notify server that weapon was lost
                if self.websocket_connected:
                    try:
                        self.sio.emit('weapon_lost', {
                            'device_id': DEVICE_CONFIG['device_id'],
                            'timestamp': time.time()
                        })
                        logger.info(f"[{DEVICE_CONFIG['device_id']}] 📡 Notified server of weapon loss")
                    except Exception as e:
                        logger.error(f"Failed to notify server: {e}")

        # FIXED Upload Logic: Only upload high-confidence detections with proper state tracking
        if high_confidence_weapon_found:
            # Initialize upload tracking if not exists
            if not hasattr(self, 'last_upload_objects'):
                self.last_upload_objects = set()
                self.last_upload_time = 0
                self.upload_cooldown = 3.0  # 3-second cooldown between uploads
            
            # Check coordination level for upload decision
            coordination_level = 'LOW'  # Default
            if self.redis_handler:
                try:
                    coord_status = self.redis_handler.get_coordination_status()
                    # Enhance metadata if Redis detections have coordination info
                    for det in detections:
                        if 'redis_metadata' in det:
                            coordination_level = det['redis_metadata']['coordination_level']
                            break
                except:
                    pass
            
            # Check if this is a NEW detection session (different objects OR sufficient time passed)
            objects_changed = high_confidence_objects != self.last_upload_objects
            cooldown_expired = (current_time - self.last_upload_time) > self.upload_cooldown
            
            if objects_changed or (not self.last_upload_objects and cooldown_expired):
                if objects_changed:
                    logger.info(f"[{DEVICE_CONFIG['device_id']}] 🔄 HIGH-CONF objects changed: {self.last_upload_objects} → {high_confidence_objects}")
                else:
                    logger.info(f"[{DEVICE_CONFIG['device_id']}] 📤 Cooldown expired, uploading: {high_confidence_objects}")
                
                # Update tracking
                self.last_upload_objects = high_confidence_objects.copy()
                self.last_upload_time = current_time
                
                # Queue upload for high-confidence detection
                try:
                    upload_data = {
                        'frame': frame.copy(),
                        'detections': detections,
                        'objects': high_confidence_objects,
                        'reason': f'high_confidence_detection_70%+_coord_{coordination_level}'
                    }
                    self.upload_queue.put_nowait(upload_data)
                    logger.info(f"[{DEVICE_CONFIG['device_id']}] 📤 Queued HIGH-CONF upload for {high_confidence_objects} (coord: {coordination_level})")
                except:
                    logger.warning("Upload queue full, skipping upload")
            else:
                # Skip upload - same objects detected recently
                time_since_upload = current_time - self.last_upload_time
                logger.debug(f"[{DEVICE_CONFIG['device_id']}] ⏭️ Skipping upload - same objects, {time_since_upload:.1f}s since last upload")
        
        elif weapon_found and not high_confidence_weapon_found:
            # Reset upload objects when we lose high-confidence detection
            if hasattr(self, 'last_upload_objects') and self.last_upload_objects:
                logger.info(f"[{DEVICE_CONFIG['device_id']}] ⬇️ High-confidence lost, resetting upload state")
                self.last_upload_objects = set()

        return detections

    def detection_worker(self):
        """Background worker for object detection (VM primary, Google Vision SDK optional)"""
        while self.running:
            try:
                frame = self.frame_queue.get(timeout=0.1)
                
                # Primary method: Use VM inference (VM has Google Vision set up)
                detections = self.detect_objects_with_vm(frame)
                detection_source = "VM Google Vision"
                
                # Optional: If VM fails and we have direct Google Vision SDK, try that
                if not detections and GOOGLE_VISION_AVAILABLE and self.vision_client:
                    detections = self.detect_objects_with_vision(frame)
                    detection_source = "Direct Google Vision SDK"
                
                # Process with Smart Detection
                self.process_detections(frame, detections)
                
                self.last_detection_time = time.time()
                
            except Empty:
                continue
            except Exception as e:
                logger.error(f"Detection worker error: {e}")
                time.sleep(0.1)

    def upload_worker(self):
        """Background worker for ARCIS uploads"""
        while self.running:
            try:
                upload_data = self.upload_queue.get(timeout=1.0)
                self.upload_to_arcis(upload_data)
            except Empty:
                continue
            except Exception as e:
                logger.error(f"Upload worker error: {e}")
                time.sleep(0.1)

    def websocket_monitor(self):
        """Monitor WebSocket connection and reconnect if needed"""
        while self.running:
            if not self.websocket_connected:
                logger.info("WebSocket disconnected, attempting to reconnect...")
                self.connect_websocket()
            time.sleep(5)

    def draw_detections(self, frame, detections):
        """Draw detection boxes with thin borders, no text"""
        for det in detections:
            if det.get('confidence', 0) < 0.4:
                continue
                
            box = det.get('box', [0, 0, 100, 100])
            class_name = det.get('class', '').lower()

            # Only draw for weapons
            if class_name in ['weapon', 'pistol', 'rifle', 'knife']:
                try:
                    x1, y1, x2, y2 = [int(coord) for coord in box]
                    # Draw thin bounding box (line weight 1)
                    cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 255), 1)
                except:
                    continue

    def run(self):
        if not self.initialize_camera():
            return

        # Connect to WebSocket server
        if not self.connect_websocket():
            logger.error("Failed to connect to WebSocket server. Exiting.")
            return

        self.running = True
        
        # Start background workers
        detection_thread = threading.Thread(target=self.detection_worker, daemon=True)
        upload_thread = threading.Thread(target=self.upload_worker, daemon=True)
        websocket_monitor_thread = threading.Thread(target=self.websocket_monitor, daemon=True)
        
        detection_thread.start()
        upload_thread.start()
        websocket_monitor_thread.start()

        logger.info(f"🚀 Starting {DEVICE_TYPE.upper()} Smart Detection System...")
        logger.info(f"🔗 Primary Detection: VM Google Vision ({VM_IP}:{VM_PORT})")
        if GOOGLE_VISION_AVAILABLE and self.vision_client:
            logger.info(f"🔗 Backup Detection: Direct Google Vision SDK")
        logger.info(f"🧠 Smart Detection: {'Enabled' if SMART_CONFIG['enabled'] else 'Disabled'}")
        logger.info(f"📡 ARCIS Upload: {ARCIS_API_URL}")
        logger.info(f"🔌 WebSocket: {WEBSOCKET_URL}")
        logger.info("Press 'q' to quit")

        try:
            while self.running:
                ret, frame = self.cap.read()
                if not ret:
                    logger.error("Failed to capture frame")
                    break

                display_frame = frame.copy()
                
                # Use cached detection results for display (non-blocking)
                current_weapon_detected = self.weapon_detected
                
                # Draw cached detections if available (non-blocking)
                if hasattr(self, 'last_detections') and self.last_detections:
                    self.draw_detections(display_frame, self.last_detections)
                
                # Status indicators
                status_color = (0, 0, 255) if current_weapon_detected else (0, 255, 0)
                status_text = "WEAPON DETECTED!" if current_weapon_detected else "Safe"
                cv2.putText(display_frame, status_text, (10, 30),
                            cv2.FONT_HERSHEY_SIMPLEX, 1, status_color, 2)

                current_time = time.time()
                
                # VM connection status
                vm_ok = (current_time - self.last_detection_time) < 5.0
                vm_text = f"VM: {'Connected' if vm_ok else 'Disconnected'}"
                vm_color = (0, 255, 0) if vm_ok else (0, 0, 255)
                cv2.putText(display_frame, vm_text, (10, 60),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, vm_color, 2)

                # WebSocket status
                ws_color = (0, 255, 0) if self.websocket_connected else (0, 0, 255)
                ws_text = f"WS: {'Connected' if self.websocket_connected else 'Disconnected'}"
                cv2.putText(display_frame, ws_text, (10, 90),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, ws_color, 2)

                # Alarm status
                alarm_text = f"Alarm: {self.current_alarm_code or 'NONE'}"
                alarm_color = (0, 0, 255) if self.alarm_playing else (255, 255, 0)
                cv2.putText(display_frame, alarm_text, (10, 120),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, alarm_color, 2)

                # Upload stats (black text)
                cv2.putText(display_frame, f"Uploads: {self.upload_count}", (10, 150),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 2)

                # Device info
                cv2.putText(display_frame, f"Device: {DEVICE_CONFIG['device_id']}", (10, 180),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)

                # FPS counter
                self.fps_counter += 1
                if self.fps_counter % 30 == 0:
                    fps = 30.0 / (current_time - self.fps_start_time)
                    logger.info(f"📺 Display FPS: {fps:.1f} | Uploads: {self.upload_count}")
                    self.fps_start_time = current_time

                # Queue frame for smart detection processing (background)
                try:
                    self.frame_queue.put_nowait(frame.copy())
                except:
                    try:
                        self.frame_queue.get_nowait()
                        self.frame_queue.put_nowait(frame.copy())
                    except:
                        pass

                cv2.imshow(f'{DEVICE_TYPE.upper()} Smart Weapon Detection', display_frame)

                key = cv2.waitKey(1) & 0xFF
                if key == ord('q'):
                    break

        except KeyboardInterrupt:
            logger.info("Interrupted by user")
        except Exception as e:
            logger.error(f"Runtime error: {e}")
        finally:
            self.cleanup()

    def cleanup(self):
        logger.info(f"🛑 Shutting down {DEVICE_TYPE.upper()} Smart Detection...")
        self.running = False
        self.stop_alarm()

        if self.cap:
            self.cap.release()

        cv2.destroyAllWindows()
        pygame.mixer.quit()
        
        if self.sio.connected:
            self.sio.disconnect()
        
        # Clean up Redis resources
        if self.redis_handler:
            try:
                self.redis_handler.cleanup()
                logger.info("🧹 Redis cleanup completed")
            except Exception as e:
                logger.error(f"Redis cleanup error: {e}")
        
        logger.info(f"📊 Final Stats - Total Smart Uploads: {self.upload_count}")
        logger.info("✅ Cleanup complete")

if __name__ == "__main__":
    logger.info(f"🚀 {DEVICE_TYPE.upper()} Smart Weapon Detection System v3.0")
    logger.info(f"🔧 Detected Device: {DEVICE_TYPE}")
    logger.info(f"🔗 Using VM Google Vision (no local setup required)")
    logger.info(f"🧠 Smart Detection: {SMART_CONFIG}")
    logger.info(f"🔧 Device Config: {DEVICE_CONFIG}")
    
    client = WeaponDetectionClient()
    client.run()
