from ultralytics import YOLO
import torch
from pathlib import Path

def train_yolo(
    data_yaml_path: str,
    epochs: int = 100,
    imgsz: int = 416,  # Reduced from 640 for better performance on Jetson
    batch_size: int = 8,  # Reduced batch size
    model_type: str = "yolov8n.pt"  # Using nano model for Jetson
):
    # Print detailed GPU information
    print("\nGPU Information:")
    print("PyTorch version:", torch.__version__)
    print("CUDA available:", torch.cuda.is_available())
    if torch.cuda.is_available():
        print("GPU device:", torch.cuda.get_device_name(0))
        print("CUDA version:", torch.version.cuda)
        print("GPU memory:", torch.cuda.get_device_properties(0).total_memory / 1024**3, "GB")
    else:
        print("WARNING: No GPU detected! Training will be very slow on CPU.")
        print("Please check your CUDA installation if you want to use GPU.")
    
    # Initialize model
    print("\nInitializing YOLO model...")
    model = YOLO(model_type)
    
    # Train the model
    print("\nStarting training...")
    model.train(
        data=data_yaml_path,
        epochs=epochs,
        imgsz=imgsz,
        batch=batch_size,
        device=0 if torch.cuda.is_available() else 'cpu',  # Use GPU if available
        patience=50,  # Early stopping patience
        save=True,  # Save best model
        plots=True,  # Generate training plots
        workers=0,  # Reduce memory usage
        cache=False,  # Disable caching to save memory
        optimizer="SGD",  # Use SGD optimizer for better memory efficiency
        lr0=0.01,  # Initial learning rate
        lrf=0.1,  # Final learning rate
        momentum=0.937,  # SGD momentum
        weight_decay=0.0005,  # L2 regularization
        warmup_epochs=3,  # Learning rate warmup
        warmup_momentum=0.8,  # Warmup momentum
        warmup_bias_lr=0.1  # Warmup bias learning rate
    )
    
    print("\nTraining completed!")
    print(f"Best model saved at: {model.best}")
    
    # Export to ONNX format
    print("\nExporting model to ONNX format...")
    model.export(format="onnx", imgsz=imgsz, simplify=True)
    print(f"Model exported to ONNX format for Jetson deployment")

if __name__ == "__main__":
    # Path to your data.yaml file
    data_yaml = str(Path("weapon_detection/data.yaml").absolute())
    
    # Training configuration optimized for Jetson Nano
    config = {
        "data_yaml_path": data_yaml,
        "epochs": 100,
        "imgsz": 416,  # Reduced image size for better performance
        "batch_size": 8,  # Reduced batch size for memory efficiency
        "model_type": "yolov8n.pt"  # Using nano model
    }
    
    train_yolo(**config) 