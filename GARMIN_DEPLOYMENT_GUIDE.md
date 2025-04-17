# Deploying Weapon Detection Model on Garmin 360 Camera

This guide explains how to deploy your trained YOLOv8 weapon detection model with a Garmin VIRB 360 camera using a Jetson Nano as the inference device.

## Hardware Requirements

1. **Garmin VIRB 360 Camera**
2. **NVIDIA Jetson Nano** (8GB recommended)
3. **MicroSD card** (32GB+ recommended)
4. **Power supply** for Jetson Nano
5. **Network connection** between Garmin camera and Jetson Nano

## Setup Instructions

### 1. Set Up Jetson Nano

1. **Flash Jetson Nano** with the latest JetPack
   - Download from [NVIDIA Developer site](https://developer.nvidia.com/embedded/jetpack)
   - Follow the instructions to flash the SD card

2. **Set up basic dependencies**:
   ```bash
   sudo apt-get update
   sudo apt-get install -y python3-pip python3-opencv
   pip3 install ultralytics onnxruntime
   ```

### 2. Configure Garmin VIRB 360

1. **Enable Wi-Fi Access Point mode** on your Garmin camera
   - Go to Settings > Wireless > Wi-Fi > AP Mode
   - Note the IP address (typically 192.168.0.1)

2. **Enable RTSP streaming**:
   - Go to Settings > Wireless > Wi-Fi > Advanced Settings
   - Enable RTSP streaming
   - Note the RTSP URL (typically rtsp://192.168.0.1:554/live)

### 3. Transfer Model to Jetson Nano

1. **Copy your model files** to the Jetson Nano:
   - ONNX model: `runs/detect/train/weights/best.pt.onnx`
   - Or PT model: `runs/detect/train/weights/best.pt`

2. **Copy the inference script**:
   - Transfer `garmin_inference.py` to your Jetson Nano

### 4. Connect Jetson Nano to Garmin Camera

1. **Connect to Garmin's Wi-Fi network** from the Jetson Nano
   - Use the SSID and password shown on your Garmin camera

2. **Verify connection** by pinging the camera:
   ```bash
   ping 192.168.0.1
   ```

### 5. Run Inference

Run the inference script:

```bash
python3 garmin_inference.py --model /path/to/your/best.pt.onnx --source rtsp://192.168.0.1:554/live --save
```

Command-line options:
- `--model`: Path to your model file (ONNX or PT)
- `--source`: RTSP stream URL from Garmin camera
- `--conf-thres`: Detection confidence threshold (default: 0.25)
- `--imgsz`: Input image size (default: 416)
- `--save`: Save the output video with detections
- `--device`: Set to "0" for GPU or "cpu" for CPU

## Troubleshooting

1. **Cannot connect to camera**:
   - Ensure Jetson Nano is connected to Garmin's Wi-Fi network
   - Verify the camera's IP address and RTSP port
   - Check if streaming is enabled on the camera

2. **Low FPS**:
   - Reduce the image size with `--imgsz 320`
   - Use the ONNX model for better performance
   - Consider reducing resolution on the Garmin camera

3. **High memory usage**:
   - Restart the script periodically
   - Ensure no other memory-intensive applications are running

## Advanced Integration

For permanent deployment:

1. **Create a systemd service** to run on boot:
   ```bash
   sudo nano /etc/systemd/system/weapon-detection.service
   ```

2. **Add the following content**:
   ```
   [Unit]
   Description=Weapon Detection Service
   After=network.target
   
   [Service]
   ExecStart=/usr/bin/python3 /home/jetson/garmin_inference.py --model /home/jetson/best.pt.onnx --source rtsp://192.168.0.1:554/live --save
   WorkingDirectory=/home/jetson
   StandardOutput=inherit
   StandardError=inherit
   Restart=always
   User=jetson
   
   [Install]
   WantedBy=multi-user.target
   ```

3. **Enable and start the service**:
   ```bash
   sudo systemctl enable weapon-detection.service
   sudo systemctl start weapon-detection.service
   ``` 