# 🔧 ARCIS Device Payload Specifications

## Overview
This document defines the complete payload specifications for Jetson Nano and Raspberry Pi devices sending detection data to the ARCIS system. These payloads must include comprehensive system metrics to display properly in the System Metrics Modal.

## 🚀 Jetson Nano Payload - POST `/api/detections/jetson-detection`

### Complete Payload Structure:
```json
{
  "detectedObjects": [
    {
      "class": 0,
      "label": "knife",
      "confidence": 0.85,
      "bbox": [120, 180, 60, 90]
    }
  ],
  "frame": "base64_encoded_image_data",
  "systemMetrics": {
    // System Performance Metrics (Required)
    "cpu_usage": 52.1,                    // CPU utilization percentage (0-100)
    "gpu_usage": 78.3,                    // GPU utilization percentage (0-100)
    "ram_usage": 63.2,                    // RAM utilization percentage (0-100)
    "disk_usage": 45.8,                   // Disk utilization percentage (0-100)
    
    // Temperature & Voltage Metrics (Required)
    "cpu_temp": 68.2,                     // CPU temperature in Celsius
    "gpu_temp": 75.8,                     // GPU temperature in Celsius
    "cpu_voltage": 1.25,                  // CPU voltage in Volts
    "gpu_voltage": 1.15,                  // GPU voltage in Volts
    
    // Network Metrics (Required)
    "network_status": "Connected",         // "Connected" or "Disconnected"
    "network_speed": 100,                  // Network speed in Mbps
    "network_signal_strength": -42,        // Signal strength in dBm (negative values)
    
    // Detection & Performance Metrics (Required)
    "detection_latency": 135,              // Detection processing time in milliseconds
    "distance_to_detection": 3.5,         // Distance to detected object in meters
    "alert_played": false,                 // Boolean: whether audio alert was triggered
    
    // System Status (Optional - defaults available)
    "database_status": "Connected"         // Database connection status
  },
  "timestamp": "2024-01-15T11:00:00Z",
  "deviceId": "jetson-nano-001"
}
```

### Jetson Nano Hardware Reading Examples:
```python
import psutil
import GPUtil
import subprocess

def get_jetson_system_metrics():
    """Get comprehensive system metrics from Jetson Nano"""
    
    # Basic system metrics
    cpu_usage = psutil.cpu_percent(interval=1)
    ram_usage = psutil.virtual_memory().percent
    disk_usage = psutil.disk_usage('/').percent
    
    # GPU metrics (Jetson specific)
    try:
        gpus = GPUtil.getGPUs()
        gpu_usage = gpus[0].load * 100 if gpus else 0
        gpu_temp = gpus[0].temperature if gpus else 0
    except:
        gpu_usage = 0
        gpu_temp = 0
    
    # Temperature readings (Jetson specific)
    try:
        cpu_temp_raw = subprocess.check_output(['cat', '/sys/class/thermal/thermal_zone0/temp'])
        cpu_temp = float(cpu_temp_raw.decode().strip()) / 1000.0
    except:
        cpu_temp = 0
    
    # Voltage readings (Jetson specific)
    try:
        # These paths may vary depending on Jetson model
        cpu_voltage = 1.2  # Read from appropriate sensor
        gpu_voltage = 1.1  # Read from appropriate sensor
    except:
        cpu_voltage = 0
        gpu_voltage = 0
    
    # Network metrics
    network_status = "Connected" if check_network() else "Disconnected"
    network_speed = get_network_speed()
    network_signal_strength = get_wifi_signal_strength()
    
    return {
        "cpu_usage": cpu_usage,
        "gpu_usage": gpu_usage,
        "ram_usage": ram_usage,
        "disk_usage": disk_usage,
        "cpu_temp": cpu_temp,
        "gpu_temp": gpu_temp,
        "cpu_voltage": cpu_voltage,
        "gpu_voltage": gpu_voltage,
        "network_status": network_status,
        "network_speed": network_speed,
        "network_signal_strength": network_signal_strength,
        "detection_latency": detection_processing_time,
        "distance_to_detection": calculated_distance,
        "alert_played": alert_triggered,
        "database_status": "Connected"
    }
```

## 🥧 Raspberry Pi + Cloud Payload - POST `/api/detections/raspberry-detection`

### Complete Payload Structure:
```json
{
  "cloudVisionResults": [
    {
      "description": "weapon detected",
      "score": 0.92,
      "boundingPoly": {
        "vertices": [
          {"x": 120, "y": 180},
          {"x": 220, "y": 180},
          {"x": 220, "y": 250},
          {"x": 120, "y": 250}
        ]
      }
    }
  ],
  "frame": "base64_encoded_image_data",
  "systemMetrics": {
    // System Performance Metrics (Required)
    "cpu_usage": 38.5,                    // CPU utilization percentage (0-100)
    "gpu_usage": 0,                       // GPU utilization (Pi has no dedicated GPU, use 0)
    "ram_usage": 45.7,                    // RAM utilization percentage (0-100)
    "disk_usage": 62.3,                   // Disk utilization percentage (0-100)
    
    // Temperature & Voltage Metrics (Required)
    "cpu_temp": 55.3,                     // CPU temperature in Celsius
    "gpu_temp": 0,                        // No dedicated GPU, use 0
    "cpu_voltage": 1.2,                   // CPU voltage in Volts
    "gpu_voltage": 0,                     // No dedicated GPU, use 0
    
    // Network Metrics (Required)
    "network_status": "Connected",         // "Connected" or "Disconnected"
    "network_speed": 50,                   // Network speed in Mbps
    "network_signal_strength": -58,        // WiFi signal strength in dBm
    
    // Detection & Performance Metrics (Required)
    "detection_latency": 95,               // Cloud Vision API response time in ms
    "distance_to_detection": 4.2,         // Distance to detected object in meters
    "alert_played": true,                  // Boolean: whether audio alert was triggered
    
    // System Status (Optional)
    "database_status": "Connected"         // Database connection status
  },
  "timestamp": "2024-12-08T10:30:45Z",
  "deviceId": "raspberry-pi-002"
}
```

### Raspberry Pi Hardware Reading Examples:
```python
import psutil
import subprocess
import requests
import time

def get_raspberry_pi_system_metrics():
    """Get comprehensive system metrics from Raspberry Pi"""
    
    # Basic system metrics
    cpu_usage = psutil.cpu_percent(interval=1)
    ram_usage = psutil.virtual_memory().percent
    disk_usage = psutil.disk_usage('/').percent
    
    # GPU metrics (Pi has no dedicated GPU)
    gpu_usage = 0
    gpu_temp = 0
    gpu_voltage = 0
    
    # Temperature reading (Pi specific)
    try:
        cpu_temp_raw = subprocess.check_output(['vcgencmd', 'measure_temp'])
        cpu_temp = float(cpu_temp_raw.decode().strip().replace('temp=', '').replace("'C", ''))
    except:
        cpu_temp = 0
    
    # Voltage reading (Pi specific)
    try:
        cpu_voltage_raw = subprocess.check_output(['vcgencmd', 'measure_volts'])
        cpu_voltage = float(cpu_voltage_raw.decode().strip().replace('volt=', '').replace('V', ''))
    except:
        cpu_voltage = 0
    
    # Network metrics
    network_status = "Connected" if check_internet_connection() else "Disconnected"
    network_speed = get_network_speed()
    network_signal_strength = get_wifi_signal_strength()
    
    # Detection latency (measure Cloud Vision API response time)
    cloud_vision_start = time.time()
    # ... Cloud Vision API call ...
    detection_latency = (time.time() - cloud_vision_start) * 1000
    
    return {
        "cpu_usage": cpu_usage,
        "gpu_usage": gpu_usage,
        "ram_usage": ram_usage,
        "disk_usage": disk_usage,
        "cpu_temp": cpu_temp,
        "gpu_temp": gpu_temp,
        "cpu_voltage": cpu_voltage,
        "gpu_voltage": gpu_voltage,
        "network_status": network_status,
        "network_speed": network_speed,
        "network_signal_strength": network_signal_strength,
        "detection_latency": detection_latency,
        "distance_to_detection": calculated_distance,
        "alert_played": alert_triggered,
        "database_status": "Connected"
    }

def check_internet_connection():
    """Check if Pi has internet connectivity"""
    try:
        requests.get("https://8.8.8.8", timeout=3)
        return True
    except:
        return False

def get_wifi_signal_strength():
    """Get WiFi signal strength in dBm"""
    try:
        output = subprocess.check_output(['iwconfig', 'wlan0'])
        # Parse signal strength from iwconfig output
        signal_line = [l for l in output.decode().split('\n') if 'Signal level' in l][0]
        signal_strength = int(signal_line.split('Signal level=')[1].split(' dBm')[0])
        return signal_strength
    except:
        return -50  # Default reasonable value

def get_network_speed():
    """Estimate network speed in Mbps"""
    try:
        # This is a simplified example - implement proper speed test
        return 50  # Mbps
    except:
        return 0
```

## 🏷️ Field Definitions & Ranges

### System Performance Metrics:
- **cpu_usage**: 0-100 (percentage)
- **gpu_usage**: 0-100 (percentage, 0 for Pi)
- **ram_usage**: 0-100 (percentage)
- **disk_usage**: 0-100 (percentage)

### Temperature & Voltage:
- **cpu_temp**: 20-85°C (normal operating range)
- **gpu_temp**: 20-90°C (0 for Pi)
- **cpu_voltage**: 0.8-1.4V (typical range)
- **gpu_voltage**: 0.8-1.4V (0 for Pi)

### Network Metrics:
- **network_status**: "Connected" | "Disconnected"
- **network_speed**: 0-1000+ Mbps
- **network_signal_strength**: -30 to -90 dBm (WiFi only)

### Detection Metrics:
- **detection_latency**: 10-5000ms (processing time)
- **distance_to_detection**: 0-50m (estimated distance)
- **alert_played**: true | false

## 🚨 Critical Fields for Frontend Display

The SystemMetricsModal specifically looks for these field names:
- `cpu_usage` ❌ NOT `cpu`
- `ram_usage` ❌ NOT `memory`
- `cpu_temp` ❌ NOT `temperature`
- `gpu_usage`, `gpu_temp`, `cpu_voltage`, `gpu_voltage`
- `network_status`, `network_speed`, `network_signal_strength`
- `disk_usage`, `detection_latency`, `distance_to_detection`
- `alert_played`, `database_status`

## 📊 Display Behavior

### Missing Fields:
If any field is missing, the frontend will display "N/A"

### Progress Bars:
- CPU, GPU, RAM, Disk usage show colored progress bars
- Green (0-40%), Yellow (40-60%), Orange (60-80%), Red (80-100%)

### Status Badges:
- Network Status: Green for "Connected", Red for others
- Alert Played: Green for true, Red for false
- Database Status: Green for "Connected", Red for others

## 🧪 Testing Payloads

### Minimal Test Payload (Raspberry Pi):
```json
{
  "cloudVisionResults": [
    {
      "description": "weapon detected",
      "score": 0.92,
      "boundingPoly": {
        "vertices": [
          {"x": 120, "y": 180},
          {"x": 220, "y": 180},
          {"x": 220, "y": 250},
          {"x": 120, "y": 250}
        ]
      }
    }
  ],
  "frame": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "systemMetrics": {
    "cpu_usage": 45.3,
    "gpu_usage": 0,
    "ram_usage": 52.1,
    "disk_usage": 68.5,
    "cpu_temp": 38.2,
    "gpu_temp": 0,
    "cpu_voltage": 1.2,
    "gpu_voltage": 0,
    "network_status": "Connected",
    "network_speed": 50,
    "network_signal_strength": -45,
    "detection_latency": 125,
    "distance_to_detection": 3.8,
    "alert_played": true,
    "database_status": "Connected"
  },
  "timestamp": "2024-12-08T10:30:45Z",
  "deviceId": "raspberry-pi-002"
}
```

This specification ensures that all system metrics will display properly in the ARCIS dashboard System Metrics Modal. 