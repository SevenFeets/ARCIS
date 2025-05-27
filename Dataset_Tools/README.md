# Dataset Tools

This folder contains comprehensive tools for managing, merging, and preparing datasets for the ARCIS weapon detection system.

## 📁 Contents

### Primary Dataset Tools
- `dataset_merger.py` - **Main dataset merger for ARCIS**
  - Merges 9+ different weapon/military datasets
  - Intelligent class mapping with fallback defaults
  - Creates multiple train/val/test splits (80/10/10, 70/15/15, 75/12.5/12.5)
  - Handles 442,399+ annotations across 248,374+ images
  - Standardizes 19 threat classes

### Legacy Merge Tools
- `merge_datasets.py` - General dataset merging utility
- `merge_mixed_datasets.py` - Mixed format dataset merger
- `merge_structured_dataset.py` - Structured dataset merger

### Dataset Management
- `balance_dataset.py` - Dataset balancing and augmentation
- `setup_dataset.py` - Initial dataset setup and validation

## 🎯 Key Features

### Intelligent Class Mapping
The dataset merger automatically maps various class names to standardized categories:

#### Weapons
- `gun`, `rifle`, `pistol`, `handgun` → Specific weapon types
- `weapon_holding`, `unknown_weapon` → `weapon` (fallback)
- `knife`, `sword`, `bazooka`, `grenade_launcher` → Specific types

#### Military Vehicles
- `military_tank`, `military_truck` → Specific vehicle types
- `unknown_vehicle` → `military_vehicle` (fallback)

#### Aircraft
- `military_aircraft`, `military_helicopter` → Specific aircraft types
- `civilian_aircraft` → Civilian aircraft
- `unknown_aircraft` → `aircraft` (fallback)

#### Criminal Behavior
- `punch`, `slap`, `balaclava` → `high_warning`

### Dataset Statistics
After merging, the ARCIS dataset contains:
- **Total Images**: 248,374
- **Total Annotations**: 442,399
- **Classes**: 19 standardized threat categories
- **Splits Available**: 3 different train/val/test ratios

## 🚀 Quick Start

### Merge ARCIS Dataset
```bash
cd Dataset_Tools
python dataset_merger.py
```

### Balance Existing Dataset
```bash
python balance_dataset.py --dataset_path ../ARCIS_Dataset_80_10_10
```

### Setup New Dataset
```bash
python setup_dataset.py --source_path /path/to/raw/data
```

## 📊 Supported Dataset Formats

### Input Formats
- **YOLO format** (.txt annotation files)
- **COCO format** (JSON annotations)
- **Pascal VOC** (XML annotations)
- **Custom formats** (with mapping configuration)

### Output Format
- **YOLO format** with standardized class mapping
- **data.yaml** configuration file
- **Train/Val/Test splits** in separate folders
- **Class statistics** and distribution reports

## 🔧 Configuration Options

### Dataset Merger Options
```python
# In dataset_merger.py
DATASET_SPLITS = {
    "80_10_10": {"train": 0.8, "val": 0.1, "test": 0.1},
    "70_15_15": {"train": 0.7, "val": 0.15, "test": 0.15},
    "75_12_12": {"train": 0.75, "val": 0.125, "test": 0.125}
}
```

### Class Mapping Customization
```python
# Modify class mappings in dataset_merger.py
WEAPON_KEYWORDS = ['gun', 'rifle', 'pistol', 'knife', ...]
VEHICLE_KEYWORDS = ['tank', 'truck', 'armored', ...]
AIRCRAFT_KEYWORDS = ['aircraft', 'plane', 'helicopter', ...]
```

## 📈 Dataset Quality Assurance

### Validation Features
- **Duplicate detection** and removal
- **Annotation validation** (bounding box checks)
- **Class distribution analysis**
- **Image quality assessment**
- **Missing file detection**

### Statistics Generation
- Class distribution charts
- Dataset size analysis
- Annotation density maps
- Quality metrics reporting

## 🔄 Workflow

### 1. Prepare Source Datasets
```bash
# Organize your datasets in the datasets/ folder
datasets/
├── weapon_detection_balanced/
├── gun_holding_person/
├── knife-detection/
├── 70k_Guns/
├── various_weapons_by_type/
├── tanks/
├── military_vehicles/
├── aircraft/
└── crime_personality/
```

### 2. Run Dataset Merger
```bash
python dataset_merger.py
```

### 3. Validate Output
```bash
# Check generated datasets
ls ../ARCIS_Dataset_*
```

### 4. Balance if Needed
```bash
python balance_dataset.py --dataset_path ../ARCIS_Dataset_80_10_10
```

## 📋 Output Structure

After running the dataset merger, you'll get:
```
ARCIS_Dataset_80_10_10/
├── data.yaml
├── train/
│   ├── images/
│   └── labels/
├── val/
│   ├── images/
│   └── labels/
└── test/
    ├── images/
    └── labels/
```

## 🛠️ Troubleshooting

### Common Issues
1. **Missing source datasets**: Ensure all datasets are in the `datasets/` folder
2. **Class mapping errors**: Check class name consistency in source datasets
3. **Memory issues**: Use smaller batch sizes for large datasets
4. **Duplicate images**: Run duplicate detection before merging

### Debug Commands
```bash
# Check dataset statistics
python -c "from dataset_merger import analyze_dataset; analyze_dataset('path/to/dataset')"

# Validate annotations
python setup_dataset.py --validate_only --dataset_path path/to/dataset
```

## 📚 Related Tools

- **Original ARCIS System**: `../Original_ARCIS_System/` - Uses these datasets for training
- **Redis System**: `../ARCIS_Redis_System/` - Distributed version using these datasets
- **Documentation**: `../Documentation/README_Dataset_Merger.md` - Detailed merger documentation

---

**Note**: These tools are designed to work with the ARCIS weapon detection system. The merged datasets are optimized for military threat classification and tactical applications. 