from ultralytics import YOLO
import torch
import os
import cv2
import matplotlib.pyplot as plt
import random
from pathlib import Path

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
        label_path = os.path.join(label_dir, img_file.replace(".jpg", ".txt"))
        
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
    model_type: str = "yolov8n.pt"
):
    """Train YOLO model with the given configuration"""
    # Initialize model
    model = YOLO(model_type)
    
    # Print GPU information
    print(f"\nTraining on device: {torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'CPU'}")
    
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
        warmup_bias_lr=0.1
    )
    
    print("\nTraining completed!")
    # Fix: Access the best model from the runs folder instead of model.best attribute
    best_model_path = Path("runs/detect/train/weights/best.pt")
    print(f"Best model saved at: {best_model_path}")
    
    # Export to ONNX format
    print("\nExporting model to ONNX format...")
    # Use the best model for export
    export_model = YOLO(best_model_path)
    export_model.export(format="onnx", imgsz=imgsz, simplify=True)
    print(f"Model exported to ONNX format for Jetson deployment at: {best_model_path.with_suffix('.onnx')}")

if __name__ == "__main__":
    # Dataset path
    dataset_path = Path("weapon_detection")
    data_yaml = str(dataset_path / "data.yaml")
    
    # Analyze dataset
    analyze_dataset(dataset_path)
    
    # Plot sample images
    plot_sample_images(dataset_path)
    
    # Training configuration
    config = {
        "data_yaml_path": data_yaml,
        "epochs": 100,
        "imgsz": 416,
        "batch_size": 8,
        "model_type": "yolov8n.pt"
    }
    
    # Start training
    train_yolo(**config)

# Load your trained model
model = YOLO("runs/detect/train/weights/best.pt")

# Export to ONNX
model.export(format="onnx", imgsz=416, simplify=True) 