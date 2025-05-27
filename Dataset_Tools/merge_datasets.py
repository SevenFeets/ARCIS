import os
import shutil
import yaml
from pathlib import Path
import random
from tqdm import tqdm

def merge_datasets(new_folders, existing_dataset_path="weapon_detection", train_ratio=0.8):
    """
    Merge additional image folders into an existing YOLO dataset.
    
    Args:
        new_folders (list): List of paths to new folders containing weapon images
        existing_dataset_path (str): Path to the existing YOLO dataset
        train_ratio (float): Ratio of images to add to training set (rest go to validation)
    """
    existing_dataset = Path(existing_dataset_path)
    
    # Ensure the existing dataset has the expected structure
    if not existing_dataset.exists():
        print(f"Error: Existing dataset not found at {existing_dataset}")
        return
        
    train_img_dir = existing_dataset / "train" / "images"
    train_label_dir = existing_dataset / "train" / "labels"
    val_img_dir = existing_dataset / "val" / "images"
    val_label_dir = existing_dataset / "val" / "labels"
    
    # Create destination directories if they don't exist
    train_img_dir.mkdir(parents=True, exist_ok=True)
    train_label_dir.mkdir(parents=True, exist_ok=True)
    val_img_dir.mkdir(parents=True, exist_ok=True)
    val_label_dir.mkdir(parents=True, exist_ok=True)
    
    # Count existing images
    existing_train_count = len(list(train_img_dir.glob("*")))
    existing_val_count = len(list(val_img_dir.glob("*")))
    print(f"Existing dataset has {existing_train_count} training images and {existing_val_count} validation images")
    
    # Process each new folder
    added_train = 0
    added_val = 0
    
    for folder_path in new_folders:
        folder = Path(folder_path)
        if not folder.exists():
            print(f"Warning: Folder {folder} not found, skipping")
            continue
            
        print(f"\nProcessing folder: {folder}")
        
        # List all image files in the folder
        image_extensions = ['.jpg', '.jpeg', '.png', '.bmp']
        image_files = []
        
        for ext in image_extensions:
            image_files.extend(list(folder.glob(f"*{ext}")))
            image_files.extend(list(folder.glob(f"*{ext.upper()}")))
        
        print(f"Found {len(image_files)} images")
        
        # Shuffle the files for randomized train/val split
        random.shuffle(image_files)
        
        # Determine split indices
        train_size = int(len(image_files) * train_ratio)
        
        # Process train files
        print("Adding training images:")
        for i, img_path in enumerate(tqdm(image_files[:train_size])):
            # Create a unique name for the image to avoid conflicts
            new_name = f"new_{folder.stem}_{img_path.stem}_{i}{img_path.suffix}"
            
            # Copy the image to the train directory
            shutil.copy2(img_path, train_img_dir / new_name)
            
            # Create a corresponding empty label file (or copy if exists)
            label_path = img_path.with_suffix('.txt')
            if label_path.exists():
                shutil.copy2(label_path, train_label_dir / (new_name.split('.')[0] + '.txt'))
            else:
                # Create an empty label file with a default weapon annotation
                with open(train_label_dir / (new_name.split('.')[0] + '.txt'), 'w') as f:
                    # Format: class x_center y_center width height
                    # Default to a centered object taking up 50% of the image
                    f.write("0 0.5 0.5 0.5 0.5")
            
            added_train += 1
        
        # Process validation files
        print("Adding validation images:")
        for i, img_path in enumerate(tqdm(image_files[train_size:])):
            # Create a unique name for the image
            new_name = f"new_{folder.stem}_{img_path.stem}_{i}{img_path.suffix}"
            
            # Copy the image to the validation directory
            shutil.copy2(img_path, val_img_dir / new_name)
            
            # Create a corresponding empty label file (or copy if exists)
            label_path = img_path.with_suffix('.txt')
            if label_path.exists():
                shutil.copy2(label_path, val_label_dir / (new_name.split('.')[0] + '.txt'))
            else:
                # Create an empty label file with a default weapon annotation
                with open(val_label_dir / (new_name.split('.')[0] + '.txt'), 'w') as f:
                    # Format: class x_center y_center width height
                    # Default to a centered object taking up 50% of the image
                    f.write("0 0.5 0.5 0.5 0.5")
            
            added_val += 1
    
    # Print summary
    print("\n====== Summary ======")
    print(f"Added {added_train} images to training set")
    print(f"Added {added_val} images to validation set")
    print(f"New training set size: {existing_train_count + added_train} images")
    print(f"New validation set size: {existing_val_count + added_val} images")
    print("\nIMPORTANT: The merged images have auto-generated labels. You may need to:")
    print("1. Manually review and adjust the label files")
    print("2. Use a labeling tool to properly annotate the weapons")
    print("3. Or run inference on these images with your existing model to generate better labels")

if __name__ == "__main__":
    # Get input from user
    print("=== Weapon Dataset Merger ===")
    print("This script will merge new weapon images into your existing dataset")
    
    # Get paths to new folders
    folder_paths = []
    while True:
        folder = input("\nEnter path to a folder with weapon images (or press Enter to finish): ")
        if not folder:
            break
        folder_paths.append(folder)
    
    if not folder_paths:
        print("No folders specified. Exiting.")
        exit()
    
    # Set split ratio
    try:
        train_ratio = float(input("\nEnter the train/val split ratio (0.0-1.0, default is 0.8): ") or 0.8)
        if not 0 <= train_ratio <= 1:
            print("Invalid ratio. Using default 0.8")
            train_ratio = 0.8
    except:
        print("Invalid input. Using default ratio 0.8")
        train_ratio = 0.8
    
    # Run the merging process
    merge_datasets(folder_paths, train_ratio=train_ratio) 