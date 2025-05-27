# ARCIS - Advanced Reconnaissance and Combat Intelligence System

A comprehensive weapon detection system designed for military field operations, featuring standalone and distributed deployment options with advanced threat classification and tactical intelligence.

## 🏗️ Project Structure

```
ARCIS_MODEL/
├── 📁 Original_ARCIS_System/          # Standalone ARCIS system
│   ├── train_weapon_detection.py      # Main tactical detection system
│   ├── train_weapon_detection_gps.py  # GPS-enhanced version
│   ├── webcam_inference.py            # Simple webcam detection
│   └── requirements_gps.txt           # GPS dependencies
│
├── 📁 ARCIS_Redis_System/             # Distributed Redis-integrated system
│   ├── train_weapon_detection_redis.py # Redis-integrated detection
│   ├── arcis_redis_integration.py     # Redis manager and integration
│   ├── arcis_cloud_service.py         # Google Cloud Vision service
│   ├── arcis_api_service.py           # FastAPI for Raspberry Pi
│   ├── raspberry_pi_client.py         # Field alert client
│   ├── docker-compose.yml             # Multi-container deployment
│   ├── Dockerfile.*                   # Container configurations
│   └── DEPLOYMENT_GUIDE.md            # Complete deployment guide
│
├── 📁 Dataset_Tools/                  # Dataset management and merging
│   ├── dataset_merger.py              # Main ARCIS dataset merger
│   ├── merge_*.py                     # Legacy merge tools
│   ├── balance_dataset.py             # Dataset balancing
│   └── setup_dataset.py               # Dataset setup and validation
│
├── 📁 Documentation/                  # All documentation files
│   ├── README.md                      # Main project documentation
│   ├── README_Dataset_Merger.md       # Dataset merger guide
│   ├── L76K_GPS_Setup_Guide.md        # GPS setup instructions
│   ├── GITHUB_UPLOAD_GUIDE.md         # GitHub deployment guide
│   └── transfer_instructions.md       # File transfer instructions
│
├── 📁 Models/                         # Pre-trained YOLO models
│   ├── yolov8n.pt                     # YOLOv8 Nano (6.2MB)
│   └── yolo11n.pt                     # YOLO11 Nano (5.4MB)
│
├── 📁 Audio_Assets/                   # Audio alert files
│   └── danger_alert.mp3               # Primary threat alert sound
│
├── 📁 Utilities/                      # Testing and utility scripts
│   ├── test_model.py                  # Model testing and evaluation
│   ├── test_gpu.py                    # GPU functionality test
│   ├── train_yolo.py                  # Basic YOLO training
│   ├── default_train.py               # Default training config
│   └── delete_duplicate_files.py      # File cleanup utility
│
├── 📁 ARCIS_Dataset_*/                # Generated datasets (3 splits)
├── 📁 datasets/                       # Source datasets
├── 📁 runs/                           # Training results
├── 📁 sample_images/                  # Test images
├── 📁 test_results/                   # Test outputs
├── 📁 venv/                           # Python virtual environment
├── requirements.txt                   # Basic Python dependencies
└── .gitignore                         # Git ignore rules
```

## 🚀 Quick Start

### 1. Choose Your Deployment

#### Standalone System (Recommended for single device)
```bash
cd Original_ARCIS_System
python train_weapon_detection.py
```

#### Distributed System (For multi-device operations)
```bash
cd ARCIS_Redis_System
docker-compose up -d
```

#### GPS-Enhanced System (For location tracking)
```bash
cd Original_ARCIS_System
pip install -r requirements_gps.txt
python train_weapon_detection_gps.py
```

### 2. Prepare Dataset (if needed)
```bash
cd Dataset_Tools
python dataset_merger.py
```

### 3. Test System
```bash
cd Utilities
python test_gpu.py
python test_model.py --model ../Models/yolov8n.pt
```

## 🎯 System Comparison

| Feature | Original ARCIS | GPS-Enhanced | Redis-Integrated |
|---------|---------------|--------------|------------------|
| **Deployment** | Single device | Single device | Multi-device |
| **Threat Detection** | ✅ | ✅ | ✅ |
| **Military Classification** | ✅ | ✅ | ✅ |
| **Distance Estimation** | ✅ | ✅ | ✅ |
| **Mission Logging** | ✅ | ✅ | ✅ |
| **GPS Tracking** | ❌ | ✅ | ✅ |
| **MGRS Coordinates** | ❌ | ✅ | ✅ |
| **Cloud Processing** | ❌ | ❌ | ✅ |
| **Raspberry Pi Alerts** | ❌ | ❌ | ✅ |
| **Website Integration** | ❌ | ❌ | ✅ |
| **Real-time Messaging** | ❌ | ❌ | ✅ |
| **Docker Deployment** | ❌ | ❌ | ✅ |

## 🔧 Key Features

### Military-Grade Threat Classification
- **CRITICAL (RED)**: Immediate danger - tanks, aircraft, heavy weapons
- **HIGH (ORANGE)**: Significant threat - guns, rifles, weapons  
- **MEDIUM (YELLOW)**: Potential threat - handguns, knives
- **LOW (GREEN)**: Minimal threat - other objects

### Tactical Intelligence
- **Distance Estimation**: IMX415 sensor-based ranging
- **Bearing Calculation**: Directional threat assessment
- **Engagement Recommendations**: ENGAGE, AVOID, TAKE_COVER
- **Mission Logging**: JSON format with timestamps
- **SITREP Generation**: Situation reports for command

### Hardware Optimization
- **Jetson Nano**: Optimized for ARM architecture
- **Display Support**: 2K square (1440x1440) and 1080p
- **Memory Efficient**: Reduced batch sizes and inference resolution
- **Real-time Performance**: 30+ FPS on Jetson Nano

## 📊 Dataset Information

### ARCIS Merged Dataset
- **Total Images**: 248,374
- **Total Annotations**: 442,399  
- **Classes**: 19 standardized threat categories
- **Splits**: 80/10/10, 70/15/15, 75/12.5/12.5

### Source Datasets
- weapon_detection_balanced & unbalanced
- gun_holding_person (with criminal behavior)
- knife-detection, 70k_Guns, various_weapons_by_type
- tanks, military_vehicles, aircraft
- crime_personality dataset

## 🛠️ System Requirements

### Hardware
- **Jetson Nano** (4GB recommended) OR desktop/laptop
- **IMX415 Camera** with 2.8mm lens (for distance estimation)
- **Audio output** (for danger alerts)
- **Display** (2K square or 1080p)
- **Raspberry Pi** (optional, for distributed alerts)

### Software
- **Python 3.8+**
- **CUDA support** (for GPU acceleration)
- **Docker & Docker Compose** (for Redis system)
- **Redis** (for distributed system)
- **Google Cloud Account** (optional, for cloud processing)

## 📚 Documentation

Each folder contains detailed README files:

- **`Original_ARCIS_System/README.md`** - Standalone system guide
- **`ARCIS_Redis_System/README.md`** - Distributed system overview
- **`ARCIS_Redis_System/DEPLOYMENT_GUIDE.md`** - Complete deployment instructions
- **`Dataset_Tools/README.md`** - Dataset management guide
- **`Documentation/`** - All setup guides and manuals
- **`Models/README.md`** - Model specifications and usage
- **`Audio_Assets/README.md`** - Audio alert configuration
- **`Utilities/README.md`** - Testing and utility tools

## 🔄 Development Workflow

### 1. Dataset Preparation
```bash
cd Dataset_Tools
python dataset_merger.py  # Create ARCIS dataset
```

### 2. Model Training
```bash
cd Original_ARCIS_System
python train_weapon_detection.py  # Train on ARCIS dataset
```

### 3. Testing and Validation
```bash
cd Utilities
python test_model.py --model ../runs/detect/train/weights/best.pt
```

### 4. Deployment
```bash
# Standalone deployment
cd Original_ARCIS_System
python train_weapon_detection.py

# Distributed deployment  
cd ARCIS_Redis_System
docker-compose up -d
```

## 🚨 Security and Safety

### Field Operation Safety
- **Audio Alerts**: Immediate notification of critical threats
- **Visual Indicators**: Color-coded threat level display
- **Distance Warnings**: Real-time range estimation
- **Engagement Guidance**: Tactical recommendations

### Data Security
- **Local Processing**: No data leaves device (standalone mode)
- **Encrypted Communication**: HTTPS/WSS for distributed mode
- **Access Control**: API authentication and authorization
- **Audit Logging**: Comprehensive operation logs

## 🤝 Support and Maintenance

### Getting Help
1. **Check Documentation**: Each folder has detailed README files
2. **Review Logs**: Check system logs for error messages
3. **Test Components**: Use utilities to verify system health
4. **Validate Configuration**: Ensure proper setup

### Regular Maintenance
- **Update Models**: Retrain with new data periodically
- **Clean Datasets**: Remove duplicates and invalid data
- **Monitor Performance**: Check inference speed and accuracy
- **Backup Configurations**: Save working configurations

## 📈 Future Enhancements

### Planned Features
- **Multi-camera Support**: Simultaneous camera feeds
- **Advanced Analytics**: Threat pattern analysis
- **Mobile App Integration**: Remote monitoring and control
- **Enhanced Cloud AI**: Improved threat classification
- **Voice Commands**: Hands-free operation

### Contributing
- **Dataset Contributions**: Add new weapon/threat datasets
- **Model Improvements**: Optimize detection accuracy
- **Feature Requests**: Suggest new tactical features
- **Bug Reports**: Report issues and improvements

---

**⚠️ IMPORTANT**: This system is designed for military and security applications. Ensure proper authorization and compliance with local laws and regulations before deployment.

**📧 Contact**: For technical support or deployment assistance, refer to the documentation in each system folder. 