#!/usr/bin/env python3
"""
Comprehensive Dataset Merger for ARCIS Model
Merges weapon, military vehicle, aircraft, and crime datasets with standardized class mapping.
"""

import os
import shutil
import yaml
import random
import json
from pathlib import Path
from collections import defaultdict, Counter
import argparse

class DatasetMerger:
    def __init__(self, datasets_dir="datasets", output_dir="merged_dataset"):
        self.datasets_dir = Path(datasets_dir)
        self.output_dir = Path(output_dir)
        
        # Define class mapping according to user specifications
        self.class_mapping = {
            # Weapons - specific types or default to 'weapon'
            'weapon': 'weapon',
            'gun': 'gun',
            'Gun': 'gun', 
            'Handgun': 'handgun',
            'Knife': 'knife',
            'Automatic Rifle': 'automatic_rifle',
            'Bazooka': 'bazooka',
            'Grenade Launcher': 'grenade_launcher',
            'Weapon Holding': 'weapon_holding',
            
            # Military vehicles - specific types or default to 'military_vehicle'
            'military tank': 'military_tank',
            'military truck': 'military_truck', 
            'Aerial_Tank_Images - v2 2023-06-07 3-07pm': 'military_tank',
            
            # Aircraft - specific types or default to 'aircraft'
            'military aircraft': 'military_aircraft',
            'military helicopter': 'military_helicopter',
            'civilian aircraft': 'civilian_aircraft',
            
            # Crime/High Warning classes
            'Punch': 'high_warning',
            'Slap': 'high_warning', 
            'balaclava': 'high_warning',
            'criminal': 'high_warning',
            
            # Other relevant classes
            'Person': 'person',
            'person': 'person',
            'civilian car': 'civilian_car',
            'Fire': 'fire',
            'Smoke': 'smoke'
        }
        
        # Define dataset configurations
        self.dataset_configs = {
            'weapon_detection_balanced&unbalanced/balanced80_10_!0': {
                'type': 'standard',
                'priority': 'high'
            },
            'gun_holding_person_21_12.v2i.yolov8': {
                'type': 'standard', 
                'priority': 'high'
            },
            'knife-detection.v2i.yolov8': {
                'type': 'standard',
                'priority': 'medium'
            },
            '70k Guns.v5-main.yolov8': {
                'type': 'standard',
                'priority': 'high'
            },
            'various_weapons_by_type.yolov8': {
                'type': 'custom',
                'priority': 'high'
            },
            'tanks.v1i.yolov8': {
                'type': 'standard',
                'priority': 'medium'
            },
            'ilitary vehicles of numerous classes.yolov8': {
                'type': 'standard', 
                'priority': 'high'
            },
            'crime.v10i.yolov8': {
                'type': 'standard',
                'priority': 'medium'
            },
            'Fire_Detection.v8i.yolov8': {
                'type': 'standard',
                'priority': 'low'
            }
        }
        
    def load_dataset_config(self, dataset_path):
        """Load dataset configuration from data.yaml"""
        config_file = dataset_path / 'data.yaml'
        if config_file.exists():
            with open(config_file, 'r') as f:
                return yaml.safe_load(f)
        return None
    
    def process_various_weapons_metadata(self, dataset_path):
        """Process the various_weapons_by_type dataset with custom metadata"""
        metadata_file = dataset_path / 'metadata.csv'
        weapon_types = {}
        
        if metadata_file.exists():
            with open(metadata_file, 'r') as f:
                lines = f.readlines()[1:]  # Skip header
                for line in lines:
                    parts = line.strip().split(',')
                    if len(parts) >= 3:
                        filename = parts[0]
                        target_id = int(parts[2])
                        
                        # Extract weapon type from filename
                        weapon_type = filename.split('_')[0]
                        if '_' in filename:
                            weapon_type = filename.rsplit('_', 1)[0]
                            weapon_type = weapon_type.replace('_', ' ')
                        
                        weapon_types[target_id] = weapon_type
        
        return weapon_types
    
    def get_mapped_class(self, original_class):
        """Map original class to standardized class"""
        if original_class in self.class_mapping:
            return self.class_mapping[original_class]
        
        # Apply default mapping rules
        original_lower = original_class.lower()
        
        # Weapon defaults
        if any(keyword in original_lower for keyword in ['gun', 'rifle', 'pistol', 'weapon', 'knife', 'sword']):
            return 'weapon'
        
        # Military vehicle defaults  
        if any(keyword in original_lower for keyword in ['tank', 'truck', 'vehicle', 'armored']):
            return 'military_vehicle'
            
        # Aircraft defaults
        if any(keyword in original_lower for keyword in ['aircraft', 'plane', 'helicopter', 'drone']):
            return 'aircraft'
            
        # Keep original if no mapping found
        return original_class.lower().replace(' ', '_')
    
    def collect_all_data(self):
        """Collect all images and labels from all datasets"""
        all_data = []
        class_counts = Counter()
        
        for dataset_name, config in self.dataset_configs.items():
            dataset_path = self.datasets_dir / dataset_name
            
            if not dataset_path.exists():
                print(f"Warning: Dataset {dataset_name} not found, skipping...")
                continue
                
            print(f"Processing dataset: {dataset_name}")
            
            if config['type'] == 'custom' and 'various_weapons' in dataset_name:
                # Handle various_weapons_by_type specially
                weapon_types = self.process_various_weapons_metadata(dataset_path)
                
                # Process train and test directories
                for split_dir in ['weapon_detection/train', 'weapon_detection/val', 'test']:
                    split_path = dataset_path / split_dir
                    if split_path.exists():
                        data = self.process_split_directory(split_path, dataset_name, weapon_types)
                        all_data.extend(data)
                        
            else:
                # Handle standard YOLO datasets
                dataset_config = self.load_dataset_config(dataset_path)
                if not dataset_config:
                    print(f"Warning: No data.yaml found for {dataset_name}")
                    continue
                
                class_names = dataset_config.get('names', [])
                
                # Process train, val, test directories
                for split in ['train', 'val', 'valid', 'test']:
                    split_path = dataset_path / split
                    if split_path.exists():
                        data = self.process_split_directory(split_path, dataset_name, class_names)
                        all_data.extend(data)
        
        # Count classes
        for item in all_data:
            class_counts[item['mapped_class']] += 1
            
        print(f"\nTotal samples collected: {len(all_data)}")
        print("Class distribution:")
        for class_name, count in class_counts.most_common():
            print(f"  {class_name}: {count}")
            
        return all_data, class_counts
    
    def process_split_directory(self, split_path, dataset_name, class_info):
        """Process a single split directory (train/val/test)"""
        data = []
        
        # Look for images directory
        images_dir = split_path / 'images' if (split_path / 'images').exists() else split_path
        labels_dir = split_path / 'labels' if (split_path / 'labels').exists() else split_path
        
        if not images_dir.exists():
            return data
            
        # Process all images
        for img_file in images_dir.glob('*'):
            if img_file.suffix.lower() in ['.jpg', '.jpeg', '.png', '.bmp']:
                # Find corresponding label file
                label_file = labels_dir / f"{img_file.stem}.txt"
                
                if label_file.exists():
                    # Parse label file
                    labels = self.parse_label_file(label_file, class_info, dataset_name)
                    
                    for label in labels:
                        data.append({
                            'image_path': img_file,
                            'label_path': label_file,
                            'original_class': label['original_class'],
                            'mapped_class': label['mapped_class'],
                            'bbox': label['bbox'],
                            'dataset_source': dataset_name,
                            'original_split': split_path.name
                        })
        
        return data
    
    def parse_label_file(self, label_file, class_info, dataset_name):
        """Parse YOLO format label file"""
        labels = []
        
        with open(label_file, 'r') as f:
            for line in f:
                parts = line.strip().split()
                if len(parts) >= 5:
                    class_id = int(parts[0])
                    bbox = [float(x) for x in parts[1:5]]
                    
                    # Get original class name
                    if isinstance(class_info, dict):  # various_weapons case
                        original_class = class_info.get(class_id, f"unknown_{class_id}")
                    elif isinstance(class_info, list):  # standard YOLO case
                        original_class = class_info[class_id] if class_id < len(class_info) else f"unknown_{class_id}"
                    else:
                        original_class = f"class_{class_id}"
                    
                    # Map to standardized class
                    mapped_class = self.get_mapped_class(original_class)
                    
                    labels.append({
                        'original_class': original_class,
                        'mapped_class': mapped_class,
                        'bbox': bbox
                    })
        
        return labels
    
    def create_splits(self, all_data, split_ratios):
        """Create train/val/test splits with specified ratios"""
        # Group by image to keep all labels for an image together
        image_groups = defaultdict(list)
        for item in all_data:
            image_groups[str(item['image_path'])].append(item)
        
        # Convert to list and shuffle
        image_list = list(image_groups.items())
        random.shuffle(image_list)
        
        # Calculate split indices
        total_images = len(image_list)
        train_end = int(total_images * split_ratios[0])
        val_end = train_end + int(total_images * split_ratios[1])
        
        # Create splits
        splits = {
            'train': image_list[:train_end],
            'val': image_list[train_end:val_end], 
            'test': image_list[val_end:]
        }
        
        print(f"\nSplit distribution:")
        for split_name, split_data in splits.items():
            total_samples = sum(len(labels) for _, labels in split_data)
            print(f"  {split_name}: {len(split_data)} images, {total_samples} labels")
        
        return splits
    
    def copy_data_to_output(self, splits, class_counts):
        """Copy images and labels to output directory with new class IDs"""
        # Create class mapping for final dataset
        unique_classes = sorted(class_counts.keys())
        class_to_id = {class_name: idx for idx, class_name in enumerate(unique_classes)}
        
        print(f"\nFinal class mapping:")
        for class_name, class_id in class_to_id.items():
            print(f"  {class_id}: {class_name}")
        
        # Create output directories
        for split_name in splits.keys():
            (self.output_dir / split_name / 'images').mkdir(parents=True, exist_ok=True)
            (self.output_dir / split_name / 'labels').mkdir(parents=True, exist_ok=True)
        
        # Copy files and create new labels
        for split_name, split_data in splits.items():
            print(f"\nCopying {split_name} data...")
            
            for img_idx, (img_path, labels) in enumerate(split_data):
                # Copy image
                img_path = Path(img_path)
                new_img_name = f"{split_name}_{img_idx:06d}{img_path.suffix}"
                new_img_path = self.output_dir / split_name / 'images' / new_img_name
                shutil.copy2(img_path, new_img_path)
                
                # Create new label file
                new_label_path = self.output_dir / split_name / 'labels' / f"{split_name}_{img_idx:06d}.txt"
                
                with open(new_label_path, 'w') as f:
                    for label in labels:
                        new_class_id = class_to_id[label['mapped_class']]
                        bbox_str = ' '.join(map(str, label['bbox']))
                        f.write(f"{new_class_id} {bbox_str}\n")
        
        # Create data.yaml for the merged dataset
        data_yaml = {
            'train': 'train/images',
            'val': 'val/images', 
            'test': 'test/images',
            'nc': len(unique_classes),
            'names': unique_classes
        }
        
        with open(self.output_dir / 'data.yaml', 'w') as f:
            yaml.dump(data_yaml, f, default_flow_style=False)
        
        # Create metadata file
        metadata = {
            'total_classes': len(unique_classes),
            'class_mapping': class_to_id,
            'class_counts': dict(class_counts),
            'split_ratios': {
                'train': len(splits['train']) / sum(len(s) for s in splits.values()),
                'val': len(splits['val']) / sum(len(s) for s in splits.values()),
                'test': len(splits['test']) / sum(len(s) for s in splits.values())
            },
            'source_datasets': list(self.dataset_configs.keys())
        }
        
        with open(self.output_dir / 'metadata.json', 'w') as f:
            json.dump(metadata, f, indent=2)
        
        return class_to_id, unique_classes
    
    def merge_datasets(self, split_ratios=(0.8, 0.1, 0.1), output_suffix=""):
        """Main method to merge all datasets"""
        output_dir = f"{self.output_dir}{output_suffix}" if output_suffix else self.output_dir
        self.output_dir = Path(output_dir)
        
        print(f"Starting dataset merge with split ratios: {split_ratios}")
        print(f"Output directory: {self.output_dir}")
        
        # Set random seed for reproducibility
        random.seed(42)
        
        # Collect all data
        all_data, class_counts = self.collect_all_data()
        
        if not all_data:
            print("No data found! Please check dataset paths.")
            return
        
        # Create splits
        splits = self.create_splits(all_data, split_ratios)
        
        # Copy data to output
        class_to_id, unique_classes = self.copy_data_to_output(splits, class_counts)
        
        print(f"\nDataset merge completed successfully!")
        print(f"Output saved to: {self.output_dir}")
        print(f"Total classes: {len(unique_classes)}")
        
        return self.output_dir

def main():
    parser = argparse.ArgumentParser(description='Merge multiple YOLO datasets')
    parser.add_argument('--datasets_dir', default='datasets', help='Directory containing source datasets')
    parser.add_argument('--output_dir', default='merged_dataset', help='Output directory for merged dataset')
    parser.add_argument('--split_ratios', nargs=3, type=float, default=[0.8, 0.1, 0.1], 
                       help='Train/Val/Test split ratios (default: 0.8 0.1 0.1)')
    
    args = parser.parse_args()
    
    # Validate split ratios
    if abs(sum(args.split_ratios) - 1.0) > 0.001:
        print("Error: Split ratios must sum to 1.0")
        return
    
    # Create merger and run
    merger = DatasetMerger(args.datasets_dir, args.output_dir)
    
    # Create multiple versions as requested
    print("Creating 80/10/10 split...")
    merger.merge_datasets(split_ratios=(0.8, 0.1, 0.1), output_suffix="_80_10_10")
    
    print("\nCreating 70/15/15 split...")
    merger.merge_datasets(split_ratios=(0.7, 0.15, 0.15), output_suffix="_70_15_15")
    
    print("\nCreating 75/12.5/12.5 split (recommended for large datasets)...")
    merger.merge_datasets(split_ratios=(0.75, 0.125, 0.125), output_suffix="_75_12_12")

if __name__ == "__main__":
    main() 