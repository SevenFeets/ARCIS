#!/usr/bin/env python3
"""
Test Script for Smart Detection Logic
"""

import time
from collections import deque

class MockSmartDetectionTracker:
    """Mock version for testing smart detection logic"""
    
    def __init__(self, client_id, buffer_size=30, middle_position=15):
        self.client_id = client_id
        self.buffer_size = buffer_size
        self.middle_position = middle_position
        
        self.frame_buffer = deque(maxlen=buffer_size)
        self.detection_buffer = deque(maxlen=buffer_size)
        
        self.current_objects = set()
        self.frames_since_detection_start = 0
        self.has_sent_initial_frame = False
        self.upload_count = 0
        self.uploads_made = []
    
    def add_frame(self, frame_id, detections, min_confidence=0.5):
        """Add frame and test upload logic"""
        self.frame_buffer.append(frame_id)
        self.detection_buffer.append(detections.copy())
        
        # Get high-confidence objects
        current_objects = set()
        for detection in detections:
            if detection['confidence'] >= min_confidence:
                current_objects.add(detection['class'])
        
        upload_decision = self._evaluate_upload_need(current_objects)
        
        if upload_decision['should_upload']:
            upload_data = self._prepare_upload_data(upload_decision['reason'], detections)
            self.uploads_made.append(upload_data)
            return upload_data
        
        return None
    
    def _evaluate_upload_need(self, current_objects):
        """Smart detection logic"""
        
        # Case 1: No objects
        if not current_objects:
            if self.current_objects:
                print(f"[{self.client_id}] 🔄 Lost detection: {self.current_objects}")
                self._reset_detection_state()
            return {'should_upload': False, 'reason': 'no_objects'}
        
        # Case 2: First detection
        if not self.current_objects:
            print(f"[{self.client_id}] 🆕 NEW detection: {current_objects}")
            self._start_new_detection(current_objects)
            return {'should_upload': False, 'reason': 'detection_started'}
        
        # Case 3: New objects added
        new_objects = current_objects - self.current_objects
        if new_objects:
            print(f"[{self.client_id}] ➕ NEW objects: {new_objects} (added to {self.current_objects})")
            self.current_objects = current_objects
            self._start_new_detection(current_objects)
            return {'should_upload': False, 'reason': 'new_objects_added'}
        
        # Case 4: 15th frame reached
        if self.current_objects == current_objects:
            self.frames_since_detection_start += 1
            
            if (self.frames_since_detection_start == self.middle_position and 
                not self.has_sent_initial_frame):
                print(f"[{self.client_id}] 📤 15th frame upload: {current_objects}")
                self.has_sent_initial_frame = True
                return {'should_upload': True, 'reason': 'middle_frame_reached'}
        
        # Case 5: Object composition changed
        if self.current_objects != current_objects:
            lost_objects = self.current_objects - current_objects
            print(f"[{self.client_id}] 🔄 Objects changed - Lost: {lost_objects}, Current: {current_objects}")
            
            if current_objects:
                self._start_new_detection(current_objects)
                return {'should_upload': False, 'reason': 'composition_changed'}
            else:
                self._reset_detection_state()
                return {'should_upload': False, 'reason': 'all_lost'}
        
        return {'should_upload': False, 'reason': 'continuing'}
    
    def _start_new_detection(self, objects):
        self.current_objects = objects.copy()
        self.frames_since_detection_start = 1
        self.has_sent_initial_frame = False
    
    def _reset_detection_state(self):
        self.current_objects = set()
        self.frames_since_detection_start = 0
        self.has_sent_initial_frame = False
    
    def _prepare_upload_data(self, reason, detections):
        if len(self.frame_buffer) < self.middle_position:
            return None
        
        best_detection = max(detections, key=lambda x: x['confidence']) if detections else None
        self.upload_count += 1
        
        print(f"[{self.client_id}] 📊 UPLOAD #{self.upload_count} - {best_detection['class']} - {reason}")
        
        return {
            'frame': self.frame_buffer[self.middle_position - 1],
            'detection': best_detection,
            'reason': reason,
            'upload_count': self.upload_count
        }

def create_detection(obj_class, confidence):
    return {'class': obj_class, 'confidence': confidence}

def test_single_object():
    print("\n" + "="*50)
    print("TEST 1: Single Object Continuous")
    print("="*50)
    
    tracker = MockSmartDetectionTracker("jetson1")
    
    # 25 frames with same pistol
    for i in range(1, 26):
        detections = [create_detection('pistol', 0.8)]
        upload = tracker.add_frame(f"frame_{i}", detections)
        if upload:
            print(f"✅ Upload at frame {i}")
    
    print(f"Result: {len(tracker.uploads_made)} uploads")

def test_multiple_objects():
    print("\n" + "="*50)
    print("TEST 2: Multiple Objects Added")
    print("="*50)
    
    tracker = MockSmartDetectionTracker("jetson1")
    
    # Frames 1-10: Pistol only
    for i in range(1, 11):
        detections = [create_detection('pistol', 0.8)]
        upload = tracker.add_frame(f"frame_{i}", detections)
    
    # Frame 11: Rifle appears
    print("\n--- Rifle appears ---")
    detections = [create_detection('pistol', 0.8), create_detection('rifle', 0.9)]
    upload = tracker.add_frame("frame_11", detections)
    
    # Frames 12-25: Both objects
    for i in range(12, 26):
        detections = [create_detection('pistol', 0.8), create_detection('rifle', 0.9)]
        upload = tracker.add_frame(f"frame_{i}", detections)
        if upload:
            print(f"✅ Upload at frame {i}")
    
    print(f"Result: {len(tracker.uploads_made)} uploads")

def test_loss_recovery():
    print("\n" + "="*50)
    print("TEST 3: Object Loss and Recovery")
    print("="*50)
    
    tracker = MockSmartDetectionTracker("jetson1")
    
    # Frames 1-20: Pistol
    for i in range(1, 21):
        detections = [create_detection('pistol', 0.8)]
        upload = tracker.add_frame(f"frame_{i}", detections)
        if upload:
            print(f"✅ Upload at frame {i}")
    
    # Frames 21-25: No objects
    print("\n--- Objects lost ---")
    for i in range(21, 26):
        upload = tracker.add_frame(f"frame_{i}", [])
    
    # Frame 26: New rifle
    print("\n--- New rifle ---")
    detections = [create_detection('rifle', 0.9)]
    upload = tracker.add_frame("frame_26", detections)
    
    # Frames 27-45: Rifle continues
    for i in range(27, 46):
        detections = [create_detection('rifle', 0.9)]
        upload = tracker.add_frame(f"frame_{i}", detections)
        if upload:
            print(f"✅ Upload at frame {i}")
    
    print(f"Result: {len(tracker.uploads_made)} uploads")

def run_tests():
    print("🚀 SMART DETECTION LOGIC TESTS")
    
    test_single_object()
    test_multiple_objects()
    test_loss_recovery()
    
    print("\n" + "="*50)
    print("✅ TESTS COMPLETED")
    print("="*50)
    print("Expected behavior:")
    print("- Test 1: 1 upload (15th frame)")
    print("- Test 2: 2 uploads (pistol 15th, then both objects 15th)")
    print("- Test 3: 2 uploads (pistol 15th, then rifle 15th)")

if __name__ == "__main__":
    run_tests() 