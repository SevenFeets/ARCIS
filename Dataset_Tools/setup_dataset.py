import os
import shutil
import yaml
from pathlib import Path

def setup_yolo_dataset(dataset_path):
    # Create YOLO dataset structure
    dataset_name = "weapon_detection"
    yolo_dataset_path = Path(dataset_name)
    
    # Create necessary directories
    for split in ['train', 'val', 'test']:
        (yolo_dataset_path / split / 'images').mkdir(parents=True, exist_ok=True)
        (yolo_dataset_path / split / 'labels').mkdir(parents=True, exist_ok=True)
    
    # Create data.yaml configuration
    data_yaml = {
        'path': str(yolo_dataset_path.absolute()),
        'train': 'train/images',
        'val': 'val/images',
        'test': 'test/images',
        'names': {
            0: 'weapon'  # Update this based on your actual class names
        }
    }
    
    # Save data.yaml
    with open(yolo_dataset_path / 'data.yaml', 'w') as f:
        yaml.dump(data_yaml, f)
    
    # Copy files from source to destination
    source_path = Path(dataset_path)
    if source_path.exists():
        # Copy train files
        train_source = source_path / 'train'
        if train_source.exists():
            for img in (train_source / 'images').glob('*'):
                shutil.copy2(img, yolo_dataset_path / 'train' / 'images')
            for label in (train_source / 'labels').glob('*'):
                shutil.copy2(label, yolo_dataset_path / 'train' / 'labels')
        
        # Copy validation files
        val_source = source_path / 'valid'
        if val_source.exists():
            for img in (val_source / 'images').glob('*'):
                shutil.copy2(img, yolo_dataset_path / 'val' / 'images')
            for label in (val_source / 'labels').glob('*'):
                shutil.copy2(label, yolo_dataset_path / 'val' / 'labels')
        
        # Copy test files
        test_source = source_path / 'test'
        if test_source.exists():
            for img in (test_source / 'images').glob('*'):
                shutil.copy2(img, yolo_dataset_path / 'test' / 'images')
            for label in (test_source / 'labels').glob('*'):
                shutil.copy2(label, yolo_dataset_path / 'test' / 'labels')
    
    print(f"YOLO dataset structure created at: {yolo_dataset_path}")
    print("\nDataset setup complete!")
    print(f"Check the {yolo_dataset_path} folder for the organized dataset.")
    print("\nYou can now use this dataset for YOLO training.")

if __name__ == "__main__":
    # Use the correct dataset path
    dataset_path = Path("D:/ARCIS model/Weapon detection.v2i.yolov5pytorch")
    
    if not dataset_path.exists():
        print(f"Dataset folder not found at: {dataset_path}")
        print("Please make sure the dataset folder exists and try again.")
    else:
        setup_yolo_dataset(dataset_path) 