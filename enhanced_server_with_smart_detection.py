#!/usr/bin/env python3
"""
Enhanced Weapon Detection Server with Smart Detection Logic
Only uploads the 15th frame when new detections occur, avoiding spam uploads
"""

from flask import Flask, request, jsonify
from ultralytics import YOLO
import cv2
import numpy as np
import time
import logging
import threading
from datetime import datetime, timedelta
import os
import gc
import torch
from flask_socketio import SocketIO, emit
import json
import requests
import io
from PIL import Image
from collections import deque

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key'
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# Configuration
MODEL_PATH = 'final_distance.pt'
ALLOWED_JETSONS = {
    'jetson1': {'api_key': os.getenv('JETSON1_API_KEY', 'secretkey1')},
    'jetson2': {'api_key': os.getenv('JETSON2_API_KEY', 'secretkey2')}
}

# ARCIS Configuration with Smart Detection
ARCIS_CONFIG = {
    'enabled': True,
    'base_url': 'https://arcis-production.up.railway.app',
    'api_key': 'test-device-key-2024',
    'upload_endpoint': '/api/detections/upload-jpeg',
    'min_confidence': 0.5,
    'frame_buffer_size': 30,  # Buffer 30 frames (1 second at 30 FPS)
    'middle_frame_position': 15,  # Upload the 15th frame (middle)
}

# Device mapping for ARCIS
DEVICE_MAPPING = {
    'jetson1': {
        'device_id': 'jt_bo1',
        'device_name': 'jetson',
        'device_type': 'jetson_nano',
        'weapon_types': {'0': 'rifle', '1': 'weapon'},
        'threat_levels': {'0': 7, '1': 8}
    },
    'jetson2': {
        'device_id': 'jt_bo2',
        'device_name': 'jetson',
        'device_type': 'jetson_nano',
        'weapon_types': {'0': 'rifle', '1': 'weapon'},
        'threat_levels': {'0': 7, '1': 8}
    }
}

DETECTION_TIMEOUT = 2.0

class SmartDetectionTracker:
    """Implements smart detection logic - only uploads 15th frame for new/changed detections"""
    
    def __init__(self, client_id, buffer_size=30, middle_position=15):
        self.client_id = client_id
        self.buffer_size = buffer_size
        self.middle_position = middle_position
        
        # Frame buffer to store recent frames and detections
        self.frame_buffer = deque(maxlen=buffer_size)
        self.detection_buffer = deque(maxlen=buffer_size)
        
        # Detection state tracking
        self.current_objects = set()  # Currently detected object types
        self.detection_start_time = None
        self.frames_since_detection_start = 0
        self.has_sent_initial_frame = False
        
        # Statistics
        self.upload_count = 0
        self.last_upload_time = 0
        
        self.lock = threading.Lock()
    
    def add_frame(self, image, detections):
        """Add frame to buffer and determine if upload is needed"""
        with self.lock:
            # Store frame and detections
            self.frame_buffer.append(image.copy())
            self.detection_buffer.append(detections.copy())
            
            # Get high-confidence object types
            current_objects = set()
            for detection in detections:
                if detection['confidence'] >= ARCIS_CONFIG['min_confidence']:
                    current_objects.add(detection['class'])
            
            # Determine upload action
            upload_decision = self._evaluate_upload_need(current_objects)
            
            if upload_decision['should_upload']:
                return self._prepare_upload_data(upload_decision['reason'])
            
            return None
    
    def _evaluate_upload_need(self, current_objects):
        """Smart logic to determine when to upload"""
        
        # Case 1: No objects detected
        if not current_objects:
            if self.current_objects:
                logger.info(f"[{self.client_id}] 🔄 Lost detection: {self.current_objects}")
                self._reset_detection_state()
            return {'should_upload': False, 'reason': 'no_objects'}
        
        # Case 2: First detection after no objects
        if not self.current_objects:
            logger.info(f"[{self.client_id}] 🆕 NEW detection started: {current_objects}")
            self._start_new_detection(current_objects)
            return {'should_upload': False, 'reason': 'detection_started'}
        
        # Case 3: New objects appeared (addition to existing)
        new_objects = current_objects - self.current_objects
        if new_objects:
            logger.info(f"[{self.client_id}] ➕ NEW objects added: {new_objects} (to existing: {self.current_objects})")
            self.current_objects = current_objects
            self._start_new_detection(current_objects)
            return {'should_upload': False, 'reason': 'new_objects_added'}
        
        # Case 4: Same objects - check if we should send 15th frame
        if self.current_objects == current_objects:
            self.frames_since_detection_start += 1
            
            if (self.frames_since_detection_start == self.middle_position and 
                not self.has_sent_initial_frame):
                logger.info(f"[{self.client_id}] 📤 Sending 15th frame for: {current_objects}")
                self.has_sent_initial_frame = True
                return {'should_upload': True, 'reason': 'middle_frame_reached'}
        
        # Case 5: Object composition changed
        if self.current_objects != current_objects:
            lost_objects = self.current_objects - current_objects
            logger.info(f"[{self.client_id}] 🔄 Objects changed - Lost: {lost_objects}, Current: {current_objects}")
            
            if current_objects:
                # Still have objects - treat as new detection
                self._start_new_detection(current_objects)
                return {'should_upload': False, 'reason': 'object_composition_changed'}
            else:
                # All objects lost
                self._reset_detection_state()
                return {'should_upload': False, 'reason': 'all_objects_lost'}
        
        return {'should_upload': False, 'reason': 'continuing_detection'}
    
    def _start_new_detection(self, objects):
        """Start tracking a new detection sequence"""
        self.current_objects = objects.copy()
        self.detection_start_time = time.time()
        self.frames_since_detection_start = 1
        self.has_sent_initial_frame = False
    
    def _reset_detection_state(self):
        """Reset when no objects detected"""
        self.current_objects = set()
        self.detection_start_time = None
        self.frames_since_detection_start = 0
        self.has_sent_initial_frame = False
    
    def _prepare_upload_data(self, reason):
        """Prepare the 15th frame for upload"""
        if len(self.frame_buffer) < self.middle_position:
            logger.warning(f"[{self.client_id}] ⚠️ Not enough frames in buffer ({len(self.frame_buffer)}/{self.middle_position})")
            return None
        
        # Get the 15th frame (middle frame)
        middle_frame = self.frame_buffer[self.middle_position - 1]
        middle_detections = self.detection_buffer[self.middle_position - 1]
        
        # Filter high-confidence detections
        valid_detections = [
            det for det in middle_detections 
            if det['confidence'] >= ARCIS_CONFIG['min_confidence']
        ]
        
        if not valid_detections:
            logger.warning(f"[{self.client_id}] ⚠️ No valid detections in 15th frame")
            return None
        
        # Use highest confidence detection
        best_detection = max(valid_detections, key=lambda x: x['confidence'])
        
        self.upload_count += 1
        self.last_upload_time = time.time()
        
        logger.info(f"[{self.client_id}] 📊 Preparing upload #{self.upload_count} - {best_detection['class']} ({best_detection['confidence']:.3f})")
        
        return {
            'image': middle_frame,
            'detection': best_detection,
            'reason': reason,
            'frame_position': self.middle_position,
            'total_objects': len(valid_detections),
            'upload_count': self.upload_count,
            'objects_detected': [det['class'] for det in valid_detections]
        }

class ARCISUploader:
    """Handles ARCIS uploads with smart detection metadata"""
    
    def __init__(self, config):
        self.config = config
        
    def upload_detection(self, client_id, upload_data):
        """Upload detection to ARCIS"""
        try:
            if client_id not in DEVICE_MAPPING:
                logger.warning(f"No ARCIS mapping for client {client_id}")
                return False
                
            device_info = DEVICE_MAPPING[client_id]
            detection = upload_data['detection']
            image = upload_data['image']
            
            # Map YOLO class to ARCIS format
            yolo_class = str(detection.get('class_id', 0))
            object_type = device_info['weapon_types'].get(yolo_class, 'weapon')
            threat_level = device_info['threat_levels'].get(yolo_class, 7)
            
            # Convert image to JPEG
            if isinstance(image, np.ndarray):
                image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
                pil_image = Image.fromarray(image_rgb)
                
                img_buffer = io.BytesIO()
                pil_image.save(img_buffer, format='JPEG', quality=95)
                jpeg_bytes = img_buffer.getvalue()
            else:
                logger.error("Invalid image format")
                return False
            
            # Prepare form data with smart detection info
            form_data = {
                'object_type': object_type,
                'confidence': str(detection['confidence']),
                'threat_level': str(threat_level),
                'device_id': device_info['device_id'],
                'device_name': device_info['device_name'],
                'device_type': device_info['device_type'],
                'bounding_box': json.dumps({
                    'x': detection['box'][0],
                    'y': detection['box'][1],
                    'width': detection['box'][2] - detection['box'][0],
                    'height': detection['box'][3] - detection['box'][1]
                }),
                'system_metrics': json.dumps({
                    'device_type': device_info['device_type'],
                    'device_id': device_info['device_id'],
                    'device_name': device_info['device_name'],
                    'detection_source': 'cloud_server_smart',
                    'upload_reason': upload_data['reason'],
                    'frame_position': f"{upload_data['frame_position']}/30",
                    'total_objects_in_frame': upload_data['total_objects'],
                    'smart_upload_sequence': upload_data['upload_count'],
                    'objects_detected': upload_data['objects_detected']
                }),
                'metadata': json.dumps({
                    'device_id': device_info['device_id'],
                    'device_name': device_info['device_name'],
                    'device_type': device_info['device_type'],
                    'upload_method': 'smart_detection_15th_frame',
                    'upload_reason': upload_data['reason'],
                    'frame_buffer_position': upload_data['frame_position'],
                    'smart_detection': True
                })
            }
            
            files = {
                'detection_frame': ('detection.jpg', jpeg_bytes, 'image/jpeg')
            }
            
            headers = {
                'X-API-Key': self.config['api_key']
            }
            
            # Upload to ARCIS
            url = f"{self.config['base_url']}{self.config['upload_endpoint']}"
            response = requests.post(url, headers=headers, data=form_data, files=files, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                if result.get('success'):
                    detection_id = result.get('detection_id')
                    logger.info(f"✅ SMART Upload successful - Client: {client_id}, ID: {detection_id}, Reason: {upload_data['reason']}")
                    return True
                else:
                    logger.error(f"❌ Upload failed: {result.get('error')}")
                    return False
            else:
                logger.error(f"❌ HTTP Error {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Upload exception: {str(e)}")
            return False

class WeaponDetectionServer:
    def __init__(self, model_path):
        self.model_path = model_path
        self.model = None
        self.lock = threading.Lock()
        self.stats_per_client = {}
        
        # Smart detection trackers per client
        self.detection_trackers = {}
        
        # Alarm state tracking
        self.detection_states = {
            'jetson1': {'last_detection': None, 'currently_detecting': False, 'connected': False},
            'jetson2': {'last_detection': None, 'currently_detecting': False, 'connected': False}
        }
        
        self.arcis_uploader = ARCISUploader(ARCIS_CONFIG)
        self.initialize_model()

    def initialize_model(self):
        try:
            logger.info(f"Loading model: {self.model_path}")
            self.model = YOLO(self.model_path)

            if torch.cuda.is_available():
                logger.info(f"CUDA GPU: {torch.cuda.get_device_name(0)}")
                self.model.to('cuda')
            else:
                logger.info("Using CPU")

            # Warm up
            dummy_image = np.zeros((640, 480, 3), dtype=np.uint8)
            _ = self.model(dummy_image, verbose=False)
            
            logger.info("✅ Model initialized successfully")
            logger.info(f"Model classes: {list(self.model.names.values())}")
            
            if ARCIS_CONFIG['enabled']:
                logger.info("🎯 SMART Detection ENABLED")
                logger.info(f"📊 Buffer: {ARCIS_CONFIG['frame_buffer_size']} frames, Upload: frame #{ARCIS_CONFIG['middle_frame_position']}")
            else:
                logger.info("⚠️ ARCIS integration DISABLED")
                
            return True
        except Exception as e:
            logger.error(f"Model initialization failed: {e}")
            return False

    def get_detection_tracker(self, client_id):
        """Get or create detection tracker for client"""
        if client_id not in self.detection_trackers:
            self.detection_trackers[client_id] = SmartDetectionTracker(
                client_id, 
                ARCIS_CONFIG['frame_buffer_size'],
                ARCIS_CONFIG['middle_frame_position']
            )
        return self.detection_trackers[client_id]

    def perform_inference(self, image, client_id):
        start_time = time.time()
        detections = []

        try:
            results = self.model(image, verbose=False, conf=0.3)

            for r in results:
                if r.boxes is not None:
                    for box in r.boxes:
                        cls = int(box.cls[0])
                        conf = float(box.conf[0])
                        xyxy = box.xyxy[0].tolist()

                        detections.append({
                            'class': self.model.names[cls],
                            'class_id': cls,
                            'confidence': round(conf, 3),
                            'box': [int(x) for x in xyxy]
                        })

            inference_time = time.time() - start_time
            weapon_detected = len(detections) > 0

            # Update stats and alarm state
            with self.lock:
                if client_id not in self.stats_per_client:
                    self.stats_per_client[client_id] = {
                        'frames': 0, 'detections': 0, 'total_time': 0,
                        'smart_uploads': 0, 'upload_failures': 0
                    }

                stats = self.stats_per_client[client_id]
                stats['frames'] += 1
                stats['total_time'] += inference_time
                
                if weapon_detected:
                    stats['detections'] += 1
                    self.detection_states[client_id]['last_detection'] = datetime.now()
                    self.detection_states[client_id]['currently_detecting'] = True
                else:
                    self.detection_states[client_id]['currently_detecting'] = False

            # Smart detection logic
            if ARCIS_CONFIG['enabled']:
                tracker = self.get_detection_tracker(client_id)
                upload_data = tracker.add_frame(image, detections)
                
                if upload_data:
                    # Background upload
                    threading.Thread(
                        target=self._upload_async,
                        args=(client_id, upload_data),
                        daemon=True
                    ).start()

            if weapon_detected:
                logger.info(f"[{client_id}] 🔫 WEAPON DETECTED: {len(detections)} objects")

            return detections, inference_time

        except Exception as e:
            logger.error(f"Inference error: {e}")
            return [], time.time() - start_time
    
    def _upload_async(self, client_id, upload_data):
        """Background upload to ARCIS"""
        try:
            success = self.arcis_uploader.upload_detection(client_id, upload_data)
            
            with self.lock:
                if client_id in self.stats_per_client:
                    if success:
                        self.stats_per_client[client_id]['smart_uploads'] += 1
                    else:
                        self.stats_per_client[client_id]['upload_failures'] += 1
        except Exception as e:
            logger.error(f"Background upload error: {e}")

    def get_alarm_commands(self):
        """Alarm logic for devices"""
        current_time = datetime.now()
        timeout_delta = timedelta(seconds=DETECTION_TIMEOUT)
        
        with self.lock:
            # Update detection states
            for client_id in self.detection_states:
                state = self.detection_states[client_id]
                if (state['last_detection'] and 
                    current_time - state['last_detection'] > timeout_delta):
                    state['currently_detecting'] = False
            
            jetson1_detecting = self.detection_states['jetson1']['currently_detecting']
            jetson2_detecting = self.detection_states['jetson2']['currently_detecting']
            
            if jetson1_detecting and jetson2_detecting:
                return {'jetson1': 'BOTH', 'jetson2': 'BOTH'}
            elif jetson1_detecting:
                return {'jetson1': 'ME', 'jetson2': 'OTHER'}
            elif jetson2_detecting:
                return {'jetson1': 'OTHER', 'jetson2': 'ME'}
            else:
                return {'jetson1': 'NONE', 'jetson2': 'NONE'}

    def get_all_stats(self):
        """Get comprehensive statistics"""
        with self.lock:
            all_stats = {}
            for cid, stats in self.stats_per_client.items():
                avg_time = stats['total_time'] / stats['frames'] if stats['frames'] else 0
                
                # Smart tracker stats
                tracker_stats = {}
                if cid in self.detection_trackers:
                    tracker = self.detection_trackers[cid]
                    tracker_stats = {
                        'current_objects': list(tracker.current_objects),
                        'frames_since_start': tracker.frames_since_detection_start,
                        'sent_initial_frame': tracker.has_sent_initial_frame,
                        'upload_count': tracker.upload_count,
                        'buffer_size': len(tracker.frame_buffer)
                    }
                
                all_stats[cid] = {
                    'frames': stats['frames'],
                    'detections': stats['detections'],
                    'avg_inference_time': round(avg_time, 3),
                    'currently_detecting': self.detection_states[cid]['currently_detecting'],
                    'connected': self.detection_states[cid]['connected'],
                    'smart_uploads': stats.get('smart_uploads', 0),
                    'upload_failures': stats.get('upload_failures', 0),
                    'smart_tracker': tracker_stats
                }
        return all_stats

# Initialize server
detection_server = WeaponDetectionServer(MODEL_PATH)

def authorize(request):
    api_key = request.headers.get('X-API-Key')
    for client_id, info in ALLOWED_JETSONS.items():
        if info['api_key'] == api_key:
            return client_id
    return None

# Flask routes
@app.route('/infer', methods=['POST'])
def infer():
    client_id = authorize(request)
    if not client_id:
        return jsonify({'error': 'Unauthorized'}), 401

    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image provided'}), 400

        file = request.files['image']
        image_data = np.frombuffer(file.read(), np.uint8)
        image = cv2.imdecode(image_data, cv2.IMREAD_COLOR)

        if image is None:
            return jsonify({'error': 'Invalid image format'}), 400

        detections, inference_time = detection_server.perform_inference(image, client_id)

        return jsonify({
            'client_id': client_id,
            'detections': detections,
            'inference_time': round(inference_time, 3),
            'timestamp': datetime.now().isoformat(),
            'weapons_found': len(detections) > 0
        })

    except Exception as e:
        logger.error(f"Request error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/status', methods=['GET'])
def status():
    try:
        stats = detection_server.get_all_stats()
        commands = detection_server.get_alarm_commands()
        return jsonify({
            'status': 'running',
            'clients': stats,
            'current_alarms': commands,
            'smart_detection_config': {
                'enabled': ARCIS_CONFIG['enabled'],
                'frame_buffer_size': ARCIS_CONFIG['frame_buffer_size'],
                'upload_frame_position': ARCIS_CONFIG['middle_frame_position'],
                'min_confidence': ARCIS_CONFIG['min_confidence']
            },
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'model_loaded': detection_server.model is not None,
        'smart_detection': True,
        'arcis_integration': ARCIS_CONFIG['enabled']
    })

if __name__ == '__main__':
    if detection_server.model is None:
        logger.error("Failed to load model")
        exit(1)

    logger.info("🚀 Starting Smart Detection Server on port 8000...")
    logger.info(f"📊 Smart Detection: {ARCIS_CONFIG['frame_buffer_size']} frame buffer, upload #{ARCIS_CONFIG['middle_frame_position']}")
    logger.info(f"🎯 ARCIS Integration: {'ENABLED' if ARCIS_CONFIG['enabled'] else 'DISABLED'}")
    
    app.run(host='0.0.0.0', port=8000, debug=False) 