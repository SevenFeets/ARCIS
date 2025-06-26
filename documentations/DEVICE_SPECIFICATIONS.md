# ARCIS Device Specifications & Weapon Classifications

## 🤖 Device Types

### Jetson Nano
- **Device Name**: `jetson nano`
- **Device ID**: `bo1`
- **Capabilities**: 
  - GPU-accelerated weapon detection
  - Real-time video processing
  - On-device AI inference

### Raspberry Pi 4 + Cloud Vision
- **Device Name**: `pi4`
- **Device ID**: `pi4_c`
- **Capabilities**:
  - Cloud-based weapon detection via Google Cloud Vision
  - Cost-effective deployment
  - Network-dependent processing

## 📊 System Metrics

Both devices will send the following metrics:

### Core Metrics
- **CPU Usage**: Percentage (0-100%)
- **Memory Usage**: RAM usage in GB or percentage
- **Voltage**: System voltage levels

### Jetson Nano Additional Metrics
- **GPU Usage**: GPU utilization percentage (0-100%)
- **GPU Memory**: VRAM usage
- **Temperature**: Device temperature in Celsius

### Network Parameters
- **Current**: Standard network connectivity metrics
- **Future**: GPS positioning data (to be implemented)
  - Latitude/Longitude coordinates
  - Location accuracy
  - Timestamp of position fix

## 🔫 Weapon Classifications

The system supports 4 weapon detection categories:

### 1. Weapon (General)
- **Type**: `weapon`
- **Description**: General weapon detection when specific type cannot be determined
- **Threat Level**: Variable based on confidence
- **Use Case**: Fallback classification

### 2. Pistol
- **Type**: `pistol`
- **Description**: Handgun/pistol detection
- **Threat Level**: High (typically 7-9)
- **Characteristics**: Compact, concealable firearm

### 3. Rifle
- **Type**: `rifle`
- **Description**: Long-barrel firearm detection
- **Threat Level**: Critical (typically 8-10)
- **Characteristics**: Long-range, high-powered weapon

### 4. Knife
- **Type**: `knife`
- **Description**: Blade/knife weapon detection
- **Threat Level**: Medium-High (typically 5-8)
- **Characteristics**: Melee weapon, various sizes

## 📡 Data Transmission Format

### Jetson Nano Payload
```json
{
  "deviceId": "bo1",
  "deviceName": "jetson nano",
  "timestamp": "2025-06-26T10:00:00.000Z",
  "detectedObjects": [
    {
      "class": "rifle",
      "label": "AK-47",
      "confidence": 0.95,
      "bbox": [100, 150, 200, 100]
    }
  ],
  "frame": "base64_encoded_image_data",
  "systemMetrics": {
    "cpu_usage": 45.2,
    "gpu_usage": 78.5,
    "memory_usage": 2.1,
    "voltage": 5.0,
    "temperature": 65.8
  },
  "networkParams": {
    "signal_strength": -45,
    "connection_type": "wifi"
  }
}
```

### Raspberry Pi 4 + Cloud Payload
```json
{
  "deviceId": "pi4_c",
  "deviceName": "pi4",
  "timestamp": "2025-06-26T10:00:00.000Z",
  "cloudVisionResults": [
    {
      "description": "pistol",
      "score": 0.92,
      "boundingPoly": {
        "vertices": [
          {"x": 120, "y": 180},
          {"x": 320, "y": 180},
          {"x": 320, "y": 280},
          {"x": 120, "y": 280}
        ]
      }
    }
  ],
  "systemMetrics": {
    "cpu_usage": 38.7,
    "memory_usage": 1.8,
    "voltage": 5.1,
    "temperature": 58.3
  },
  "networkParams": {
    "signal_strength": -52,
    "connection_type": "ethernet"
  }
}
```

## 🎯 Threat Level Mapping

| Weapon Type | Confidence Range | Threat Level | Response Priority |
|-------------|------------------|--------------|-------------------|
| knife       | 0.7-0.8         | 5-6          | Medium            |
| knife       | 0.8-0.9         | 7-8          | High              |
| knife       | 0.9+            | 8            | High              |
| pistol      | 0.7-0.8         | 7-8          | High              |
| pistol      | 0.8-0.9         | 8-9          | Critical          |
| pistol      | 0.9+            | 9            | Critical          |
| rifle       | 0.7-0.8         | 8-9          | Critical          |
| rifle       | 0.8-0.9         | 9-10         | Critical          |
| rifle       | 0.9+            | 10           | Critical          |
| weapon      | 0.7-0.8         | 6-7          | Medium-High       |
| weapon      | 0.8-0.9         | 7-8          | High              |
| weapon      | 0.9+            | 8            | High              |

## 🔮 Future Enhancements

### GPS Integration
- **Location Tracking**: Real-time device positioning
- **Geofencing**: Alert zones and restricted areas
- **Incident Mapping**: Geographic visualization of threats
- **Response Coordination**: Location-based emergency response

### Enhanced Metrics
- **Battery Status**: For portable deployments
- **Storage Usage**: Local storage monitoring
- **Network Latency**: Connection quality metrics
- **Device Health**: Comprehensive system diagnostics

## 🛠️ Implementation Notes

1. **Device Identification**: System automatically detects device type based on `deviceId` prefix
2. **Metric Validation**: All metrics validated for reasonable ranges
3. **Weapon Classification**: Supports both specific types and general fallback
4. **Scalability**: Architecture supports additional device types and weapon categories
5. **Backward Compatibility**: Existing detection data remains valid

## 📋 Testing Checklist

- [ ] Jetson Nano (`bo1`) detection upload
- [ ] Raspberry Pi 4 (`pi4_c`) detection upload  
- [ ] All weapon types: weapon, pistol, rifle, knife
- [ ] System metrics validation
- [ ] Threat level calculation accuracy
- [ ] Image storage and retrieval
- [ ] Dashboard display verification 