#!/usr/bin/env python3
"""
Switch using output mode to create pull-up effect
Sets GPIO high briefly, then reads as input
"""

import os
import time
from datetime import datetime

SWITCH_GPIO = 19

class OutputPullupSwitch:
    def __init__(self, pin):
        self.pin = pin
        self.gpio_path = f"/sys/class/gpio/gpio{pin}"
        self.setup_gpio()
        
    def setup_gpio(self):
        """Setup GPIO"""
        try:
            if not os.path.exists(self.gpio_path):
                with open("/sys/class/gpio/export", "w") as f:
                    f.write(str(self.pin))
            time.sleep(0.1)
            print(f"✅ GPIO {self.pin} exported")
        except Exception as e:
            print(f"❌ Setup failed: {e}")
    
    def set_pullup(self):
        """Set pin high to simulate pull-up"""
        try:
            with open(f"{self.gpio_path}/direction", "w") as f:
                f.write("out")
            with open(f"{self.gpio_path}/value", "w") as f:
                f.write("1")
            time.sleep(0.001)  # Brief delay
        except Exception as e:
            print(f"Pullup failed: {e}")
    
    def read_input(self):
        """Switch to input and read value"""
        try:
            with open(f"{self.gpio_path}/direction", "w") as f:
                f.write("in")
            time.sleep(0.001)  # Brief delay
            
            with open(f"{self.gpio_path}/value", "r") as f:
                return int(f.read().strip())
        except Exception as e:
            return None
    
    def read_with_pullup(self):
        """Read value with software pull-up"""
        self.set_pullup()
        return self.read_input()
    
    def test_switch(self):
        """Test switch with software pull-up"""
        print("🔘 Software Pull-up Switch Test")
        print("=" * 35)
        print("Press the button to test...")
        print("Press Ctrl+C to exit")
        
        last_state = None
        press_count = 0
        
        try:
            while True:
                current_value = self.read_with_pullup()
                
                if current_value is not None:
                    current_state = current_value == 0  # LOW when pressed
                    
                    if current_state != last_state and last_state is not None:
                        timestamp = datetime.now().strftime("%H:%M:%S.%f")[:-3]
                        
                        if current_state:  # Pressed
                            press_count += 1
                            print(f"🔴 [{timestamp}] PRESSED (Count: {press_count}) - Value: {current_value}")
                        else:  # Released
                            print(f"🟢 [{timestamp}] RELEASED - Value: {current_value}")
                    
                    last_state = current_state
                
                time.sleep(0.05)
                
        except KeyboardInterrupt:
            print(f"\n🛑 Test stopped")
            print(f"Total presses: {press_count}")
    
    def cleanup(self):
        """Clean up GPIO"""
        try:
            with open("/sys/class/gpio/unexport", "w") as f:
                f.write(str(self.pin))
            print("✅ GPIO cleaned up")
        except:
            pass

def main():
    switch = OutputPullupSwitch(SWITCH_GPIO)
    switch.test_switch()
    switch.cleanup()

if __name__ == "__main__":
    main()
