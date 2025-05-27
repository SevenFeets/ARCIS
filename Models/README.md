# Models

This folder contains pre-trained YOLO model files used by the ARCIS weapon detection system.

## 📁 Contents

### Pre-trained Models
- `yolov8n.pt` - **YOLOv8 Nano model (6.2MB)**
  - Lightweight model optimized for speed
  - Ideal for Jetson Nano deployment
  - Good balance of accuracy and performance
  - Recommended for real-time applications

- `yolo11n.pt` - **YOLO11 Nano model (5.4MB)**
  - Latest YOLO architecture
  - Improved accuracy over YOLOv8
  - Optimized for edge devices
  - Enhanced feature extraction

## 🎯 Model Specifications

### YOLOv8 Nano (yolov8n.pt)
- **Size**: 6.2MB
- **Parameters**: ~3.2M
- **Input Size**: 640x640 (configurable)
- **Speed**: ~1.2ms inference (GPU)
- **mAP**: ~37.3% (COCO dataset)
- **Use Case**: Real-time detection on resource-constrained devices

### YOLO11 Nano (yolo11n.pt)
- **Size**: 5.4MB  
- **Parameters**: ~2.6M
- **Input Size**: 640x640 (configurable)
- **Speed**: ~1.0ms inference (GPU)
- **mAP**: ~39.5% (COCO dataset)
- **Use Case**: Latest architecture with improved efficiency

## 🚀 Usage

### With Original ARCIS System
```bash
cd Original_ARCIS_System
python train_weapon_detection.py
# Models are automatically loaded from ../Models/
```

### With Redis System
```bash
cd ARCIS_Redis_System
python train_weapon_detection_redis.py
# Models are automatically detected
```

### Custom Model Loading
```python
from ultralytics import YOLO

# Load YOLOv8 Nano
model = YOLO('../Models/yolov8n.pt')

# Load YOLO11 Nano
model = YOLO('../Models/yolo11n.pt')

# Run inference
results = model('image.jpg')
```

## 🔧 Model Selection Guide

### For Jetson Nano
- **Recommended**: `yolov8n.pt`
- **Alternative**: `yolo11n.pt`
- **Reason**: Optimized for ARM architecture and limited GPU memory

### For Desktop/Server
- **Recommended**: `yolo11n.pt` (latest features)
- **Alternative**: `yolov8n.pt` (proven stability)
- **Reason**: Better hardware can utilize improved architectures

### For Real-time Applications
- **Primary**: `yolo11n.pt` (fastest)
- **Backup**: `yolov8n.pt` (reliable)
- **Reason**: Speed is critical for live detection

### For High Accuracy
- **Option 1**: Fine-tune `yolo11n.pt` on ARCIS dataset
- **Option 2**: Use larger models (yolov8s.pt, yolov8m.pt)
- **Reason**: More parameters = better feature learning

## 📊 Performance Comparison

| Model | Size | Speed (GPU) | Speed (CPU) | mAP@0.5 | Memory Usage |
|-------|------|-------------|-------------|---------|--------------|
| yolov8n.pt | 6.2MB | 1.2ms | 45ms | 37.3% | 1.1GB |
| yolo11n.pt | 5.4MB | 1.0ms | 42ms | 39.5% | 1.0GB |

*Benchmarks on RTX 3080 GPU and Intel i7-10700K CPU*

## 🔄 Model Training

### Fine-tuning on ARCIS Dataset
```bash
# Using YOLOv8
python -c "
from ultralytics import YOLO
model = YOLO('../Models/yolov8n.pt')
model.train(data='../ARCIS_Dataset_80_10_10/data.yaml', epochs=100)
"

# Using YOLO11
python -c "
from ultralytics import YOLO
model = YOLO('../Models/yolo11n.pt')
model.train(data='../ARCIS_Dataset_80_10_10/data.yaml', epochs=100)
"
```

### Training from Scratch
```bash
# Start with pre-trained weights for better convergence
python train_weapon_detection.py --model ../Models/yolov8n.pt
```

## 📈 Optimization Tips

### For Jetson Nano
1. **Use TensorRT**: Convert models to TensorRT for 2-3x speedup
2. **Reduce Input Size**: Use 416x416 instead of 640x640
3. **Half Precision**: Enable FP16 for memory savings
4. **Batch Size**: Use batch_size=1 for memory constraints

### For Production
1. **Model Quantization**: Reduce precision for faster inference
2. **ONNX Export**: Use ONNX for cross-platform deployment
3. **Dynamic Batching**: Optimize for varying input sizes
4. **Memory Mapping**: Efficient model loading

## 🛠️ Model Management

### Adding New Models
```bash
# Download new model
wget https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8s.pt
mv yolov8s.pt Models/

# Update model references in scripts
```

### Model Validation
```bash
cd Utilities
python test_model.py --model ../Models/yolov8n.pt --data ../ARCIS_Dataset_80_10_10/data.yaml
```

### Export Formats
```python
from ultralytics import YOLO

model = YOLO('../Models/yolov8n.pt')

# Export to different formats
model.export(format='onnx')      # ONNX
model.export(format='engine')    # TensorRT
model.export(format='torchscript') # TorchScript
model.export(format='coreml')    # CoreML (iOS)
```

## 🔍 Troubleshooting

### Common Issues

1. **Model Not Found**
   ```bash
   # Check file exists
   ls -la Models/
   # Verify path in scripts
   ```

2. **CUDA Out of Memory**
   ```bash
   # Use smaller model or reduce batch size
   # Monitor GPU memory: nvidia-smi
   ```

3. **Slow Inference**
   ```bash
   # Check GPU utilization
   # Consider model optimization
   # Verify CUDA installation
   ```

### Performance Issues
```bash
# Benchmark model performance
python -c "
from ultralytics import YOLO
import time
model = YOLO('../Models/yolov8n.pt')
start = time.time()
results = model('test_image.jpg')
print(f'Inference time: {time.time() - start:.3f}s')
"
```

## 📚 Related Documentation

- **Original ARCIS**: `../Original_ARCIS_System/README.md` - Model usage in main system
- **Utilities**: `../Utilities/README.md` - Model testing tools
- **Training**: See training scripts for model fine-tuning
- **Deployment**: `../ARCIS_Redis_System/DEPLOYMENT_GUIDE.md` - Production deployment

---

**Note**: These models are optimized for the ARCIS weapon detection system. For best results, fine-tune on your specific dataset and deployment environment. 