# Weapon Detection Model

A YOLO-based deep learning model for detecting weapons in images and video streams. This project includes tools for training, testing, and deploying a weapon detection model on various platforms.

## Project Overview

The ARCIS model is designed to detect weapons in real-time using computer vision and deep learning. The system employs YOLO (You Only Look Once) object detection models to identify potential threats and provide instant alerts. Our solution uses color-coded bounding boxes to indicate threat levels - green for low confidence detections, yellow for medium confidence, and red for high confidence detections.

### Hardware Components
- Raspberry Pi 4 and 5 for edge computing
- NVIDIA Jetson Nano for accelerated inference
- Camera modules with IMX415 wide-angle fixed focus sensors
- Compatible with various deployment scenarios

### Core Features

- Train a custom YOLOv8 model on weapon detection datasets
- Test the model on static images and video
- Run real-time inference on webcams
- Deploy to Garmin VIRB 360 camera
- Easy transfer to other laptops/devices
- Color-coded bounding boxes based on threat confidence:
  - Green: < 10% confidence
  - Yellow: 10-75% confidence 
  - Red: > 75% confidence
- Audio alerts for high-confidence detections

## Future Development Plans

### Database Infrastructure
- **Redis**: In-memory caching for high-speed data access
- **MongoDB**: Unstructured database for storing detection logs and events
- **PostgreSQL**: Relational database for the monitoring website

### Cloud Integration
- **Google Cloud Vision**: Secondary analysis of uncertain detections (yellow level frames)
- **Claude AI API**: Advanced reanalysis of ambiguous frames for improved accuracy

### Containerization & Orchestration
- **Docker**: Containerization of the application for consistent deployment
- **Kubernetes**: Orchestration of multiple hardware nodes for coordinated detection
- Real-time notification system between connected devices

### Advanced Features
- Danger relative positioning to camera viewpoint
- Approximate distance calculation to detected threats
- Multi-device coordination for enhanced coverage

### Web Interface
- Responsive monitoring website
- Real-time detection visualization
- System metrics and performance analytics
- Comprehensive logging and reporting
- Remote configuration and management

## Project Structure

- `train_weapon_detection.py` - Script to train the YOLO model
- `test_model.py` - Script to test model on static images
- `webcam_inference.py` - Script for real-time inference on webcams
- `garmin_inference.py` - Script for Garmin VIRB 360 camera integration
- `merge_datasets.py` - Script to merge additional image datasets
- `setup_dataset.py` - Script to set up dataset structure
- `GARMIN_DEPLOYMENT_GUIDE.md` - Guide for Garmin camera deployment
- `transfer_instructions.md` - Guide for transferring model to other laptops
- `sample_images/` - Example detection images with bounding boxes

## Getting Started

### Prerequisites

- Python 3.10+
- CUDA-capable GPU (recommended)
- OpenCV
- PyTorch
- Ultralytics YOLO

### Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/YOUR-USERNAME/weapon-detection.git
   cd weapon-detection
   ```

2. Create a virtual environment and install dependencies:
   ```bash
   python -m venv venv
   # On Windows
   venv\Scripts\activate
   # On Linux/Mac
   source venv/bin/activate
   
   pip install -r requirements.txt
   ```

### Usage

1. **Training a model**:
   ```bash
   python train_weapon_detection.py
   ```

2. **Testing on images**:
   ```bash
   python test_model.py --model runs/detect/train/weights/best.pt
   ```

3. **Running on webcam**:
   ```bash
   python webcam_inference.py --model runs/detect/train/weights/best.pt
   ```

4. **Using with Garmin camera**:
   ```bash
   python garmin_inference.py --model runs/detect/train/weights/best.pt
   ```

## Model Performance

The trained model can detect weapons with high accuracy. Example performance metrics:
- Precision: ~0.9
- Recall: ~0.85
- mAP@0.5: ~0.88

## Transfer to Other Devices

See `transfer_instructions.md` for detailed steps on transferring the model to other laptops or devices.

## License

[Choose an appropriate license for your project]

## Acknowledgments

- Ultralytics for YOLOv8
- OpenCV for computer vision tools
- [Add any other acknowledgments] 