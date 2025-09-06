#!/usr/bin/env python3
"""
Switch Button Test using working GPIO pins (19 or 20)
Uses sysfs interface since it's working better than Jetson.GPIO
"""

import os
import time
from datetime import datetime

class SysfsSwitch:
    def __init__(self, pin):
        self.pin = pin
        self.gpio_path = f"/sys/class/gpio/gpio{pin}"
        self.value_path = f"{self.gpio_path}/value"
        self.direction_path = f"{self.gpio_path}/direction"
        
        self.setup_gpio()
        
    def setup_gpio(self):
        """Setup GPIO using sysfs"""
        try:
            # Export GPIO if not already exported
            if not os.path.exists(self.gpio_path):
                with open("/sys/class/gpio/export", "w") as f:
                    f.write(str(self.pin))
                print(f"✅ GPIO {self.pin} exported")
            
            # Set as input
            with open(self.direction_path, "w") as f:
                f.write("in")
            print(f"✅ GPIO {self.pin} set as input")
            
            # Small delay to ensure GPIO is ready
            time.sleep(0.1)
            
        except Exception as e:
            print(f"❌ Error setting up GPIO: {e}")
            raise
    
    def read_value(self):
        """Read GPIO value"""
        try:
            with open(self.value_path, "r") as f:
                value = int(f.read().strip())
            return value
        except Exception as e:
            print(f"❌ Error reading GPIO: {e}")
            return None
    
    def is_pressed(self):
        """Check if switch is pressed (LOW when connected to ground)"""
        value = self.read_value()
        return value == 0  # LOW when switch pressed (connected to ground)
    
    def cleanup(self):
        """Clean up GPIO"""
        try:
            if os.path.exists(self.gpio_path):
                with open("/sys/class/gpio/unexport", "w") as f:
                    f.write(str(self.pin))
                print(f"✅ GPIO {self.pin} unexported")
        except Exception as e:
            print(f"⚠️ Warning during cleanup: {e}")

def test_switch():
    """Test switch with working GPIO pin"""
    print("🔘 Switch Test - Working GPIO Pin")
    print("=" * 40)
    
    # Use GPIO 19 (Pin 35) - known to be working
    switch = SysfsSwitch(19)
    
    # Check initial state
    initial_value = switch.read_value()
    print(f"Initial GPIO 19 value: {initial_value}")
    print(f"Initial switch state: {'PRESSED' if switch.is_pressed() else 'RELEASED'}")
    print()
    print("Wiring Instructions:")
    print("- Connect switch terminal 1 to Pin 35 (GPIO 19)")
    print("- Connect switch terminal 2 to Pin 39 (Ground)")
    print("- Add 10kΩ resistor between Pin 1 (3.3V) and Pin 35")
    print()
    print("Press the switch button to test...")
    print("Press Ctrl+C to exit")
    
    last_state = switch.is_pressed()
    press_count = 0
    
    try:
        while True:
            current_state = switch.is_pressed()
            
            if current_state != last_state:
                timestamp = datetime.now().strftime("%H:%M:%S.%f")[:-3]
                
                if current_state:  # Switch pressed
                    press_count += 1
                    print(f"🔴 [{timestamp}] Switch PRESSED (Count: {press_count})")
                else:  # Switch released
                    print(f"🟢 [{timestamp}] Switch RELEASED")
                
                last_state = current_state
            
            time.sleep(0.01)  # Small delay
            
    except KeyboardInterrupt:
        print(f"\n🛑 Test stopped")
        print(f"Total button presses: {press_count}")
    finally:
        switch.cleanup()
        print("✅ GPIO cleaned up")

if __name__ == "__main__":
    test_switch()
