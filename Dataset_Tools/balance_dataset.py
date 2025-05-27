import os
import shutil
import random
from pathlib import Path
from tqdm import tqdm

def balance_dataset(dataset_path="weapon_detection", train_ratio=0.8, val_ratio=0.1, test_ratio=0.1):
    """
    Rebalance a dataset by redistributing images between train/val/test splits
    according to the specified ratios.
    
    Args:
        dataset_path (str): Path to the YOLO dataset
        train_ratio (float): Desired ratio for training set (default: 0.8)
        val_ratio (float): Desired ratio for validation set (default: 0.1)
        test_ratio (float): Desired ratio for test set (default: 0.1)
    """
    # Validate ratios
    total_ratio = train_ratio + val_ratio + test_ratio
    if not 0.99 <= total_ratio <= 1.01:  # Allow small floating point errors
        print(f"Error: Ratios must sum to 1.0, but got {total_ratio}")
        return
    
    dataset = Path(dataset_path)
    
    # Ensure the dataset has the expected structure
    if not dataset.exists():
        print(f"Error: Dataset not found at {dataset}")
        return
    
    # Set up paths
    train_img_dir = dataset / "train" / "images"
    train_label_dir = dataset / "train" / "labels"
    val_img_dir = dataset / "val" / "images"
    val_label_dir = dataset / "val" / "labels"
    test_img_dir = dataset / "test" / "images"
    test_label_dir = dataset / "test" / "labels"
    
    # Check if directories exist
    required_dirs = [train_img_dir, train_label_dir, val_img_dir, val_label_dir]
    for dir_path in required_dirs:
        if not dir_path.exists():
            print(f"Error: Required directory {dir_path} not found")
            return
    
    # Create test directories if they don't exist
    test_img_dir.mkdir(parents=True, exist_ok=True)
    test_label_dir.mkdir(parents=True, exist_ok=True)
    
    # Get all images
    train_images = list(train_img_dir.glob("*.*"))
    val_images = list(val_img_dir.glob("*.*"))
    test_images = list(test_img_dir.glob("*.*")) if test_img_dir.exists() else []
    
    # Filter for actual image files
    image_extensions = ['.jpg', '.jpeg', '.png', '.bmp', '.JPG', '.JPEG', '.PNG', '.BMP']
    train_images = [img for img in train_images if img.suffix.lower() in [ext.lower() for ext in image_extensions]]
    val_images = [img for img in val_images if img.suffix.lower() in [ext.lower() for ext in image_extensions]]
    test_images = [img for img in test_images if img.suffix.lower() in [ext.lower() for ext in image_extensions]]
    
    # Count images
    total_images = len(train_images) + len(val_images) + len(test_images)
    current_train_ratio = len(train_images) / total_images if total_images > 0 else 0
    current_val_ratio = len(val_images) / total_images if total_images > 0 else 0
    current_test_ratio = len(test_images) / total_images if total_images > 0 else 0
    
    print(f"Current dataset distribution:")
    print(f"- Training: {len(train_images)} images ({current_train_ratio:.1%})")
    print(f"- Validation: {len(val_images)} images ({current_val_ratio:.1%})")
    print(f"- Test: {len(test_images)} images ({current_test_ratio:.1%})")
    print(f"- Total: {total_images} images")
    
    # Calculate target counts
    target_train_count = int(total_images * train_ratio)
    target_val_count = int(total_images * val_ratio)
    target_test_count = total_images - target_train_count - target_val_count  # Ensure we use all images
    
    print(f"\nTarget dataset distribution:")
    print(f"- Training: {target_train_count} images ({train_ratio:.1%})")
    print(f"- Validation: {target_val_count} images ({val_ratio:.1%})")
    print(f"- Test: {target_test_count} images ({test_ratio:.1%})")
    
    # Combine all images and their current locations
    all_images = [(img, "train") for img in train_images]
    all_images.extend([(img, "val") for img in val_images])
    all_images.extend([(img, "test") for img in test_images])
    
    # Shuffle to ensure random distribution
    random.shuffle(all_images)
    
    # Create temporary directories for the rebalanced dataset
    temp_dir = dataset / "temp"
    temp_train_img = temp_dir / "train" / "images"
    temp_train_label = temp_dir / "train" / "labels"
    temp_val_img = temp_dir / "val" / "images"
    temp_val_label = temp_dir / "val" / "labels"
    temp_test_img = temp_dir / "test" / "images"
    temp_test_label = temp_dir / "test" / "labels"
    
    # Create directories
    for dir_path in [temp_train_img, temp_train_label, temp_val_img, temp_val_label, temp_test_img, temp_test_label]:
        dir_path.mkdir(parents=True, exist_ok=True)
    
    # Distribute images according to target ratios
    print("\nRebalancing dataset...")
    train_count = 0
    val_count = 0
    test_count = 0
    skipped_count = 0
    
    for i, (img, current_split) in enumerate(tqdm(all_images)):
        if i < target_train_count:
            target_split = "train"
            target_img_dir = temp_train_img
            target_label_dir = temp_train_label
            train_count += 1
        elif i < target_train_count + target_val_count:
            target_split = "val"
            target_img_dir = temp_val_img
            target_label_dir = temp_val_label
            val_count += 1
        else:
            target_split = "test"
            target_img_dir = temp_test_img
            target_label_dir = temp_test_label
            test_count += 1
        
        # Get source directories
        if current_split == "train":
            src_img_dir = train_img_dir
            src_label_dir = train_label_dir
        elif current_split == "val":
            src_img_dir = val_img_dir
            src_label_dir = val_label_dir
        else:  # test
            src_img_dir = test_img_dir
            src_label_dir = test_label_dir
        
        # Copy image to target location
        img_filename = img.name
        label_filename = img.stem + ".txt"
        src_label_path = src_label_dir / label_filename
        
        try:
            # Copy image
            shutil.copy2(img, target_img_dir / img_filename)
            
            # Copy label if exists
            if src_label_path.exists():
                shutil.copy2(src_label_path, target_label_dir / label_filename)
            else:
                # Skip this image if label doesn't exist
                print(f"Warning: No label found for {img_filename}, skipping")
                skipped_count += 1
                # Remove the copied image since we're skipping it
                (target_img_dir / img_filename).unlink(missing_ok=True)
                
                # Adjust counts
                if target_split == "train":
                    train_count -= 1
                elif target_split == "val":
                    val_count -= 1
                else:
                    test_count -= 1
        except Exception as e:
            print(f"Error processing {img_filename}: {e}")
    
    print(f"\nRebalancing complete!")
    print(f"- {train_count} images placed in training set")
    print(f"- {val_count} images placed in validation set")
    print(f"- {test_count} images placed in test set")
    print(f"- {skipped_count} images skipped due to missing labels")
    
    # Ask for confirmation before replacing original dataset
    confirm = input("\nReplace original dataset with rebalanced version? (y/n): ")
    if confirm.lower() == 'y':
        # Backup original dataset
        backup_dir = dataset.parent / f"{dataset.name}_backup"
        if backup_dir.exists():
            i = 1
            while (dataset.parent / f"{dataset.name}_backup_{i}").exists():
                i += 1
            backup_dir = dataset.parent / f"{dataset.name}_backup_{i}"
        
        print(f"Creating backup at {backup_dir}")
        shutil.copytree(dataset, backup_dir)
        
        # Replace original directories with temp directories
        print("Replacing original dataset with rebalanced version...")
        
        # Remove original image and label directories
        for dir_path in [train_img_dir, train_label_dir, val_img_dir, val_label_dir, test_img_dir, test_label_dir]:
            if dir_path.exists():
                for file in dir_path.glob("*"):
                    file.unlink()
        
        # Copy from temp to original
        for src, dest in [
            (temp_train_img, train_img_dir),
            (temp_train_label, train_label_dir),
            (temp_val_img, val_img_dir),
            (temp_val_label, val_label_dir),
            (temp_test_img, test_img_dir),
            (temp_test_label, test_label_dir)
        ]:
            for file in src.glob("*"):
                shutil.copy2(file, dest / file.name)
        
        # Remove temp directory
        shutil.rmtree(temp_dir)
        
        print("\nDataset successfully rebalanced!")
        print(f"A backup of the original dataset was created at {backup_dir}")
    else:
        print("\nOperation cancelled. Temporary files will be removed.")
        # Remove temp directory
        shutil.rmtree(temp_dir)

if __name__ == "__main__":
    print("=== Dataset Balancer ===")
    print("This tool will rebalance your dataset by redistributing images between train/val/test splits.")
    print("The original dataset will be backed up before any changes are made.")
    
    # Get ratios from user
    try:
        train_ratio = float(input("\nEnter the desired training set ratio (default is 0.8): ") or 0.8)
        val_ratio = float(input("Enter the desired validation set ratio (default is 0.1): ") or 0.1)
        test_ratio = float(input("Enter the desired test set ratio (default is 0.1): ") or 0.1)
        
        # Normalize ratios to ensure they sum to 1.0
        total = train_ratio + val_ratio + test_ratio
        if total != 1.0:
            print(f"Normalizing ratios to sum to 1.0 (current sum: {total})")
            train_ratio /= total
            val_ratio /= total
            test_ratio /= total
            print(f"Adjusted ratios: train={train_ratio:.2f}, val={val_ratio:.2f}, test={test_ratio:.2f}")
    
    except ValueError:
        print("Invalid input. Using default ratios: 80% train, 10% val, 10% test")
        train_ratio, val_ratio, test_ratio = 0.8, 0.1, 0.1
    
    # Run the balancing process
    balance_dataset(train_ratio=train_ratio, val_ratio=val_ratio, test_ratio=test_ratio) 