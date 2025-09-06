#!/usr/bin/env python3
"""
Basic Switch Button Test for Jetson Nano
Pin 18 (GPIO 24) - Switch input
Pin 14 - Ground
"""

import Jetson.GPIO as GPIO
import time

# GPIO Configuration
SWITCH_PIN = 19  # Pin 35 (GPIO 19) - Working pin

def setup_gpio():
    """Initialize GPIO settings"""
    GPIO.setmode(GPIO.BCM)  # Use BCM pin numbering
    GPIO.setup(SWITCH_PIN, GPIO.IN, pull_up_down=GPIO.PUD_UP)  # Pull-up resistor
    print(f"✅ GPIO {SWITCH_PIN} (Pin 35) configured as input with pull-up")

def test_switch():
    """Test switch button functionality"""
    print("🔘 Switch Button Test")
    print("=" * 30)
    print("Press the switch button to test...")
    print("Press Ctrl+C to exit")
    
    last_state = GPIO.input(SWITCH_PIN)
    print(f"Initial switch state: {'RELEASED' if last_state == GPIO.LOW else 'PRESSED'}")
    
    try:
        while True:
            current_state = GPIO.input(SWITCH_PIN)
            
            if current_state != last_state:
                if current_state == GPIO.HIGH:
                    print("🔴 Switch PRESSED (Circuit opened)")
                else:
                    print("🟢 Switch RELEASED (Circuit closed)")
                
                last_state = current_state
            
            time.sleep(0.01)  # Small delay to prevent excessive CPU usage
            
    except KeyboardInterrupt:
        print("\n🛑 Test stopped")
    finally:
        GPIO.cleanup()
        print("✅ GPIO cleaned up")

if __name__ == "__main__":
    setup_gpio()
    test_switch()
