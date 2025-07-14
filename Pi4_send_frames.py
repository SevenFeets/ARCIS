import cv2
import requests
import numpy as np
import threading
import time
import pygame
import json
from queue import Queue, Empty
import logging

# Configuration
VM_IP = "34.0.85.5"
VM_PORT = 8000
INFERENCE_URL = f"http://{VM_IP}:{VM_PORT}/infer"
ALARM_PATH = "/home/barvaz/Desktop/alarm.mp3"

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class WeaponDetectionClient:
    def __init__(self):
        self.cap = None
        self.running = False
        self.weapon_detected = False
        self.alarm_playing = False

        # Initialize pygame mixer for audio
        try:
            pygame.mixer.init()
            logger.info("Audio system initialized")
        except Exception as e:
            logger.error(f"Failed to initialize audio: {e}")

        # Thread-safe queues
        self.frame_queue = Queue(maxsize=2)
        self.detection_lock = threading.Lock()

        # Performance tracking
        self.last_inference_time = 0
        self.fps_counter = 0
        self.fps_start_time = time.time()

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

    def play_alarm(self):
        try:
            if not pygame.mixer.get_init():
                return

            pygame.mixer.music.load(ALARM_PATH)
            pygame.mixer.music.play(-1)
            self.alarm_playing = True
            logger.info("Alarm started")

        except Exception as e:
            logger.error(f"Failed to play alarm: {e}")

    def stop_alarm(self):
        try:
            if self.alarm_playing:
                pygame.mixer.music.stop()
                self.alarm_playing = False
                logger.info("Alarm stopped")
        except Exception as e:
            logger.error(f"Failed to stop alarm: {e}")

    def send_frame_for_inference(self, frame):
        try:
            _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
            files = {'image': ('frame.jpg', buffer.tobytes(), 'image/jpeg')}
            response = requests.post(INFERENCE_URL, files=files, timeout=2.0)

            if response.status_code == 200:
                result = response.json()
                detections = result.get('detections', [])

                weapon_labels = {"weapon", "pistol", "rifle", "knife"}
                weapon_found = any(
                    det.get("class", "").strip().lower() in weapon_labels
                    for det in detections
                )

                with self.detection_lock:
                    previous_state = self.weapon_detected
                    self.weapon_detected = weapon_found

                    if weapon_found and not previous_state:
                        threading.Thread(target=self.play_alarm, daemon=True).start()
                    elif not weapon_found and previous_state:
                        self.stop_alarm()

                for det in detections:
                    logger.info(f"Detected: {det['class']} ({det['confidence']:.3f})")

                return detections

        except requests.exceptions.Timeout:
            logger.warning("Inference request timed out")
        except requests.exceptions.RequestException as e:
            logger.warning(f"Network error: {e}")
        except Exception as e:
            logger.error(f"Inference error: {e}")

        return []

    def draw_detections(self, frame, detections):
        for det in detections:
            box = det['box']
            class_name = det['class']
            confidence = det['confidence']

            cv2.rectangle(frame, (box[0], box[1]), (box[2], box[3]), (0, 0, 255), 2)
            label = f"{class_name}: {confidence:.3f}"
            label_size = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)[0]
            cv2.rectangle(frame, (box[0], box[1] - label_size[1] - 10),
                          (box[0] + label_size[0], box[1]), (0, 0, 255), -1)
            cv2.putText(frame, label, (box[0], box[1] - 5),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)

    def inference_worker(self):
        while self.running:
            try:
                frame = self.frame_queue.get(timeout=0.1)
                detections = self.send_frame_for_inference(frame)
                self.last_inference_time = time.time()
            except Empty:
                continue
            except Exception as e:
                logger.error(f"Inference worker error: {e}")
                time.sleep(0.1)

    def run(self):
        if not self.initialize_camera():
            return

        self.running = True
        inference_thread = threading.Thread(target=self.inference_worker, daemon=True)
        inference_thread.start()

        logger.info("Starting video stream...")
        logger.info(f"Connecting to inference server at {INFERENCE_URL}")
        logger.info("Press 'q' to quit")

        try:
            while self.running:
                ret, frame = self.cap.read()
                if not ret:
                    logger.error("Failed to capture frame")
                    break

                display_frame = frame.copy()
                status_color = (0, 0, 255) if self.weapon_detected else (0, 255, 0)
                status_text = "WEAPON DETECTED!" if self.weapon_detected else "Safe"
                cv2.putText(display_frame, status_text, (10, 30),
                            cv2.FONT_HERSHEY_SIMPLEX, 1, status_color, 2)

                current_time = time.time()
                connection_ok = (current_time - self.last_inference_time) < 5.0
                conn_text = "Connected" if connection_ok else "Disconnected"
                conn_color = (0, 255, 0) if connection_ok else (0, 0, 255)
                cv2.putText(display_frame, f"VM: {conn_text}", (10, 60),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, conn_color, 2)

                self.fps_counter += 1
                if self.fps_counter % 30 == 0:
                    fps = 30.0 / (current_time - self.fps_start_time)
                    logger.info(f"Display FPS: {fps:.1f}")
                    self.fps_start_time = current_time

                try:
                    self.frame_queue.put_nowait(frame.copy())
                except:
                    try:
                        self.frame_queue.get_nowait()
                        self.frame_queue.put_nowait(frame.copy())
                    except:
                        pass

                cv2.imshow('Weapon Detection - Live Feed', display_frame)

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
        logger.info("Shutting down...")
        self.running = False
        self.stop_alarm()

        if self.cap:
            self.cap.release()

        cv2.destroyAllWindows()
        pygame.mixer.quit()
        logger.info("Cleanup complete")

if __name__ == "__main__":
    client = WeaponDetectionClient()
    client.run()

