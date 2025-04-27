import os
import shutil
import yaml
from pathlib import Path
from tqdm import tqdm

def merge_mixed_dataset(new_dataset_path, existing_dataset_path="weapon_detection"):
    """
    Merge a dataset that has train/valid folders (but may not have test) into an existing YOLO dataset.
    
    Args:
        new_dataset_path (str): Path to the new dataset with train/valid folders
        existing_dataset_path (str): Path to the existing YOLO dataset
    """
    existing_dataset = Path(existing_dataset_path)
    new_dataset = Path(new_dataset_path)
    
    # Check if the new dataset has the expected structure
    expected_folders = ["train"]
    missing_folders = []
    for folder in expected_folders:
        if not (new_dataset / folder).exists():
            missing_folders.append(folder)
    
    # Check for validation folder (either "val" or "valid")
    has_val_folder = (new_dataset / "val").exists() or (new_dataset / "valid").exists()
    if not has_val_folder:
        missing_folders.append("val/valid")
    
    if missing_folders:
        print(f"Warning: New dataset is missing expected folders: {', '.join(missing_folders)}")
        print("Expected structure: train/ and val/ (or valid/)")
        return
    
    # Handle "val" vs "valid" naming
    val_folder_name = "val"
    if (new_dataset / "valid").exists():
        val_folder_name = "valid"
    
    # Ensure the existing dataset has the expected structure
    if not existing_dataset.exists():
        print(f"Error: Existing dataset not found at {existing_dataset}")
        return
    
    # Set up paths
    existing_train_img = existing_dataset / "train" / "images"
    existing_train_label = existing_dataset / "train" / "labels"
    existing_val_img = existing_dataset / "val" / "images"
    existing_val_label = existing_dataset / "val" / "labels"
    
    # Create destination directories if they don't exist
    existing_train_img.mkdir(parents=True, exist_ok=True)
    existing_train_label.mkdir(parents=True, exist_ok=True)
    existing_val_img.mkdir(parents=True, exist_ok=True)
    existing_val_label.mkdir(parents=True, exist_ok=True)
    
    # Count existing images
    existing_train_count = len(list(existing_train_img.glob("*")))
    existing_val_count = len(list(existing_val_img.glob("*")))
    
    print(f"\nExisting dataset stats:")
    print(f"- Training images: {existing_train_count}")
    print(f"- Validation images: {existing_val_count}")
    
    # Process each split (train, val)
    added_train = 0
    added_val = 0
    
    # Define a function to process a folder
    def process_folder(source_folder, dest_img_dir, dest_label_dir, folder_type):
        added_count = 0
        
        # Check for images subfolder
        img_folder = source_folder
        if (source_folder / "images").exists():
            img_folder = source_folder / "images"
        
        # Check for labels subfolder
        label_folder = source_folder
        if (source_folder / "labels").exists():
            label_folder = source_folder / "labels"
        
        # List all image files in the folder
        image_extensions = ['.jpg', '.jpeg', '.png', '.bmp']
        image_files = []
        
        for ext in image_extensions:
            image_files.extend(list(img_folder.glob(f"*{ext}")))
            image_files.extend(list(img_folder.glob(f"*{ext.upper()}")))
        
        print(f"Found {len(image_files)} images in {folder_type} folder")
        
        # Process files
        print(f"Adding {folder_type} images:")
        for i, img_path in enumerate(tqdm(image_files)):
            # Create a unique name for the image to avoid conflicts
            img_stem = img_path.stem
            img_suffix = img_path.suffix
            new_name = f"new_{source_folder.name}_{img_stem}_{i}{img_suffix}"
            
            # Copy the image to the destination directory
            shutil.copy2(img_path, dest_img_dir / new_name)
            
            # Handle the label file
            # First, try with the same name in the labels folder
            label_path = label_folder / f"{img_stem}.txt"
            
            # If not found, try with the exact same path but with .txt extension
            if not label_path.exists():
                label_path = img_path.with_suffix('.txt')
            
            if label_path.exists():
                # Copy the label file with the new name
                new_label_name = f"new_{source_folder.name}_{img_stem}_{i}.txt"
                shutil.copy2(label_path, dest_label_dir / new_label_name)
            else:
                # Create an empty label file with a default weapon annotation
                with open(dest_label_dir / f"new_{source_folder.name}_{img_stem}_{i}.txt", 'w') as f:
                    # Format: class x_center y_center width height
                    # Default to a centered object taking up 50% of the image
                    f.write("0 0.5 0.5 0.5 0.5")
                print(f"  Warning: No label found for {img_path.name}, created default label")
            
            added_count += 1
        
        return added_count
    
    # Process train folder
    if (new_dataset / "train").exists():
        added_train = process_folder(
            new_dataset / "train", 
            existing_train_img, 
            existing_train_label,
            "training"
        )
    
    # Process val folder
    if (new_dataset / val_folder_name).exists():
        added_val = process_folder(
            new_dataset / val_folder_name, 
            existing_val_img, 
            existing_val_label,
            "validation"
        )
    
    # Print summary
    print("\n====== Summary ======")
    print(f"Added {added_train} images to training set")
    print(f"Added {added_val} images to validation set")
    print(f"New training set size: {existing_train_count + added_train} images")
    print(f"New validation set size: {existing_val_count + added_val} images")
    
    if (added_train + added_val) > 0:
        print("\nIMPORTANT: Please check if some images have auto-generated labels. You may need to:")
        print("1. Manually review and adjust any default label files")
        print("2. Use a labeling tool to properly annotate images with default labels")
        print("3. Or run inference on these images with your existing model to generate better labels")
        
        print("\nNote: You have a significant imbalance in your dataset - valid has more images than train.")
        print("This is unusual and might negatively impact model performance.")
        print("Consider:")
        print("1. Using a different train/valid split for this dataset")
        print("2. Checking if the images in 'valid' are actually meant to be training data")
        print("3. Or reclassifying some validation images as training images")

if __name__ == "__main__":
    print("=== Mixed Dataset Merger ===")
    print("This script merges a dataset that has train/valid folders")
    print("into your existing weapon_detection dataset while preserving the splits.")
    
    # Get path to the new dataset
    new_dataset = input("\nEnter the path to the dataset folder (with train/valid subfolders): ")
    
    if not new_dataset:
        print("No dataset specified. Exiting.")
        exit()
    
    # Run the merging process
    merge_mixed_dataset(new_dataset) 