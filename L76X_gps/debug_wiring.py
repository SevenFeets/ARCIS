#!/usr/bin/env python3
"""
Debug script to test wiring step by step
"""

import os
import time
from datetime import datetime

SWITCH_GPIO = 19

def setup_gpio():
    """Setup GPIO 19"""
    gpio_path = f"/sys/class/gpio/gpio{SWITCH_GPIO}"
    
    try:
        if not os.path.exists(gpio_path):
            with open("/sys/class/gpio/export", "w") as f:
                f.write(str(SWITCH_GPIO))
        
        with open(f"{gpio_path}/direction", "w") as f:
            f.write("in")
        
        time.sleep(0.1)
        return True
    except Exception as e:
        print(f"Setup failed: {e}")
        return False

def read_gpio():
    """Read GPIO 19 value"""
    try:
        with open(f"/sys/class/gpio/gpio{SWITCH_GPIO}/value", "r") as f:
            return int(f.read().strip())
    except Exception as e:
        print(f"Read failed: {e}")
        return None

def debug_wiring():
    """Debug wiring connections"""
    print("🔧 Wiring Debug Test")
    print("=" * 30)
    
    if not setup_gpio():
        return
    
    print("Current wiring should be:")
    print("- Pin 1 (3.3V) → 10kΩ resistor → Pin 35 (GPIO 19)")
    print("- Pin 35 (GPIO 19) → Switch terminal 1") 
    print("- Switch terminal 2 → Pin 39 (Ground)")
    print()
    
    # Test 1: Check initial value
    print("Test 1: Initial GPIO value")
    initial = read_gpio()
    print(f"GPIO 19 value: {initial}")
    
    if initial == 1:
        print("✅ Pull-up working (should be 1 when switch is open)")
    elif initial == 0:
        print("⚠️ Reading 0 - switch might be pressed or wiring issue")
    else:
        print("❌ Can't read GPIO")
        return
    
    print()
    print("Test 2: Manual connection test")
    print("Step 1: Disconnect switch completely from Pin 35")
    print("Press Enter when disconnected...")
    input()
    
    value1 = read_gpio()
    print(f"Pin 35 floating: {value1}")
    
    print("\nStep 2: Connect Pin 35 directly to Pin 39 (Ground) with jumper wire")
    print("Press Enter when connected...")
    input()
    
    value2 = read_gpio()
    print(f"Pin 35 connected to ground: {value2}")
    
    print("\nStep 3: Remove jumper wire")
    print("Press Enter when removed...")
    input()
    
    value3 = read_gpio()
    print(f"Pin 35 floating again: {value3}")
    
    print("\nStep 4: Connect your switch")
    print("Press Enter when switch is connected...")
    input()
    
    print("Now testing switch for 30 seconds...")
    print("Press and release the switch multiple times...")
    
    last_value = read_gpio()
    change_count = 0
    
    for i in range(300):  # 30 seconds
        current_value = read_gpio()
        
        if current_value != last_value:
            change_count += 1
            timestamp = datetime.now().strftime("%H:%M:%S.%f")[:-3]
            print(f"🔄 [{timestamp}] Change #{change_count}: {last_value} → {current_value}")
            last_value = current_value
        
        time.sleep(0.1)
    
    print(f"\nTest complete. Total changes detected: {change_count}")
    
    # Cleanup
    try:
        with open("/sys/class/gpio/unexport", "w") as f:
            f.write(str(SWITCH_GPIO))
    except:
        pass

if __name__ == "__main__":
    debug_wiring()
