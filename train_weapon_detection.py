from ultralytics import YOLO
import torch
import os
import cv2
import matplotlib.pyplot as plt
import random
from pathlib import Path
import numpy as np
import pygame
import threading
import time

def analyze_dataset(dataset_path):
    """Analyze the dataset structure and content"""
    print("\nDataset Analysis:")
    splits = ["train", "val", "test"]
    for split in splits:
        images_path = os.path.join(dataset_path, split, "images")
        labels_path = os.path.join(dataset_path, split, "labels")
        num_images = len(os.listdir(images_path))
        num_labels = len(os.listdir(labels_path))
        print(f"{split}: {num_images} images, {num_labels} label files")

def plot_sample_images(dataset_path, split="train", num_samples=5):
    """Plot sample images with their bounding boxes"""
    image_dir = os.path.join(dataset_path, split, "images")
    label_dir = os.path.join(dataset_path, split, "labels")
    
    image_files = random.sample(os.listdir(image_dir), min(num_samples, len(os.listdir(image_dir))))
    
    plt.figure(figsize=(15, 3*len(image_files)))
    for idx, img_file in enumerate(image_files):
        img_path = os.path.join(image_dir, img_file)
        label_path = os.path.join(label_dir, img_file.replace(".jpg", ".txt").replace(".jpeg", ".txt").replace(".png", ".txt"))
        
        # Load and plot image
        image = cv2.imread(img_path)
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        plt.subplot(len(image_files), 1, idx + 1)
        plt.imshow(image)
        
        # Draw bounding boxes if label exists
        if os.path.exists(label_path):
            h, w, _ = image.shape
            with open(label_path, "r") as file:
                for line in file.readlines():
                    class_id, x_center, y_center, box_w, box_h = map(float, line.split())
                    x1 = int((x_center - box_w/2) * w)
                    y1 = int((y_center - box_h/2) * h)
                    x2 = int((x_center + box_w/2) * w)
                    y2 = int((y_center + box_h/2) * h)
                    
                    plt.gca().add_patch(plt.Rectangle((x1, y1), x2-x1, y2-y1, 
                                                    edgecolor='red', linewidth=2, fill=False))
                    plt.text(x1, y1-5, f"Class {int(class_id)}", color='red', fontsize=12)
        
        plt.axis('off')
    plt.tight_layout()
    plt.show()

def train_yolo(
    data_yaml_path: str,
    epochs: int = 100,
    imgsz: int = 416,
    batch_size: int = 8,
    model_type: str = "yolov8n.pt",
    run_name: str = None
):
    """Train YOLO model with the given configuration"""
    # Initialize model
    model = YOLO(model_type)
    
    # Print GPU information
    print(f"\nTraining on device: {torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'CPU'}")
    
    # Set run name if provided
    project = "runs/detect"
    name = run_name if run_name else "train"
    
    # Train the model
    model.train(
        data=data_yaml_path,
        epochs=epochs,
        imgsz=imgsz,
        batch=batch_size,
        device=0,  # Use GPU
        patience=50,
        save=True,
        plots=True,
        workers=0,
        cache=False,
        optimizer="SGD",
        lr0=0.01,
        lrf=0.1,
        momentum=0.937,
        weight_decay=0.0005,
        warmup_epochs=3,
        warmup_momentum=0.8,
        warmup_bias_lr=0.1,
        project=project,
        name=name
    )
    
    print("\nTraining completed!")
    # Fix: Access the best model from the runs folder instead of model.best attribute
    #  best_model_path = Path("runs/detect/train/weights/best.pt") default
    best_model_path = Path(f"{project}/{name}/weights/best.pt")
    print(f"Best model saved at: {best_model_path}")
    
    # Export to ONNX format
    print("\nExporting model to ONNX format...")
    # Use the best model for export
    export_model = YOLO(best_model_path)
    export_model.export(format="onnx", imgsz=imgsz, simplify=True)
    print(f"Model exported to ONNX format for Jetson deployment at: {best_model_path.with_suffix('.onnx')}")
    
    return str(best_model_path)

def play_danger_alert():
    """Play a danger alert sound three times using pygame"""
    try:
        # Initialize pygame mixer
        pygame.mixer.init()
        
        # Look for sound file
        sound_file = "danger_alert.mp3"
        if not os.path.exists(sound_file):
            print(f"Warning: Sound file {sound_file} not found.")
            print("Using default system beep instead.")
            for _ in range(3):
                # Use print with bell character for system beep
                print("\a")
                time.sleep(0.5)
            return
        
        # Load and play sound
        sound = pygame.mixer.Sound(sound_file)
        for _ in range(3):
            sound.play()
            time.sleep(1)  # Allow time for sound to play
            
    except Exception as e:
        print(f"Could not play alert sound: {e}")
        print("Please ensure you have pygame installed: pip install pygame")
        print("And a 'danger_alert.mp3' file in your project directory.")

def color_by_confidence(confidence):
    """
    Returns the appropriate color based on confidence level
    - Green: < 10% confidence
    - Yellow: 10-75% confidence
    - Red: > 75% confidence
    """
    if confidence < 0.1:
        return (0, 255, 0)  # Green
    elif confidence < 0.75:
        return (0, 255, 255)  # Yellow
    else:
        return (0, 0, 255)  # Red (BGR format)

def run_inference_with_alerts(
    model_path="runs/detect/train/weights/best.pt",
    source=0,  # 0 for webcam, or video file path
    imgsz=416,
    conf_thres=0.25,
    enable_sound=True
):
    """
    Run inference with color-coded bounding boxes based on confidence
    and sound alerts for high confidence detections
    """
    # Load model
    model = YOLO(model_path)
    
    # Open video source
    cap = cv2.VideoCapture(source)
    if not cap.isOpened():
        print(f"Error: Could not open video source {source}")
        return
    
    # Alert sound thread
    alert_thread = None
    last_alert_time = 0
    alert_cooldown = 3  # seconds between alerts to avoid overlapping
    
    while cap.isOpened():
        success, frame = cap.read()
        if not success:
            print("Error: Failed to read from video source")
            break
        
        # Run inference
        results = model(frame, imgsz=imgsz, conf=conf_thres)
        
        # Process results
        detections_frame = frame.copy()
        high_conf_detection = False
        
        for r in results:
            boxes = r.boxes
            for box in boxes:
                # Get box coordinates
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                x1, y1, x2, y2 = int(x1), int(y1), int(x2), int(y2)
                
                # Get confidence and class
                conf = float(box.conf[0])
                cls = int(box.cls[0])
                
                # Determine color based on confidence
                color = color_by_confidence(conf)
                
                # Draw bounding box
                cv2.rectangle(detections_frame, (x1, y1), (x2, y2), color, 2)
                
                # Add label with class and confidence
                label = f"Class {cls}: {conf:.2f}"
                cv2.putText(detections_frame, label, (x1, y1-10), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
                
                # Check if high confidence detection (>= 75%)
                if conf >= 0.75:
                    high_conf_detection = True
        
        # Play alert for high confidence detections (with cooldown)
        current_time = time.time()
        if high_conf_detection and enable_sound and (current_time - last_alert_time) > alert_cooldown:
            if alert_thread is None or not alert_thread.is_alive():
                alert_thread = threading.Thread(target=play_danger_alert)
                alert_thread.daemon = True
                alert_thread.start()
                last_alert_time = current_time
        
        # Display the frame
        cv2.imshow("Weapon Detection", detections_frame)
        
        # Press 'q' to exit
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
    
    # Clean up
    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    # Dataset path
    dataset_path = Path("weapon_detection")
    data_yaml = str(dataset_path / "data.yaml")
    
    print("=== Weapon Detection System ===")
    print("1. Train a new model")
    print("2. Run inference with existing model")
    
    choice = input("Enter your choice (1 or 2): ")
    # Analyze dataset
 
    if choice == '1':
        # Analyze dataset
        analyze_dataset(dataset_path)
        
        # Plot sample images
        plot_sample_images(dataset_path)
        
        # Ask for run name
        run_name = input("Enter a name for this training run (press Enter for default 'train_merged'): ") or "train_merged"
        
        # Training configuration
        config = {
            "data_yaml_path": data_yaml,
            "epochs": 100,
            "imgsz": 416,
            "batch_size": 8,
            "model_type": "yolov8n.pt",
            "run_name": run_name
        }
        
        # Start training
 

        model_path = train_yolo(**config)
        
        # Ask if user wants to run inference with the newly trained model
        run_inference = input(f"\nTraining completed. Run inference with new model? (y/n): ")
        if run_inference.lower() == 'y':
            run_inference_with_alerts(model_path)
    
    elif choice == '2':
        # Run inference with existing model
        model_path = input("Enter the path to the model (press Enter for default 'runs/detect/train/weights/best.pt'): ") or "runs/detect/train/weights/best.pt"
        run_inference_with_alerts(model_path)
    
    else:
        print("Invalid choice. Exiting.")

# This part should be removed or commented out as it will always run
# and duplicate the ONNX export when running inference only
# Load your trained model
# model = YOLO("runs/detect/train/weights/best.pt")

# Export to ONNX
# model.export(format="onnx", imgsz=416, simplify=True) 