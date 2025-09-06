#!/usr/bin/env python3
"""
Switch without external pull-up resistor
Uses floating pin detection and change monitoring
"""

import os
import time
from datetime import datetime

SWITCH_GPIO = 19

class NoResistorSwitch:
    def __init__(self, pin):
        self.pin = pin
        self.gpio_path = f"/sys/class/gpio/gpio{pin}"
        self.value_path = f"{self.gpio_path}/value"
        self.setup_gpio()
        self.baseline_value = None
        self.press_count = 0
        
    def setup_gpio(self):
        """Setup GPIO without pull-up"""
        try:
            if not os.path.exists(self.gpio_path):
                with open("/sys/class/gpio/export", "w") as f:
                    f.write(str(self.pin))
            
            with open(f"{self.gpio_path}/direction", "w") as f:
                f.write("in")
            
            time.sleep(0.1)
            print(f"✅ GPIO {self.pin} setup complete")
        except Exception as e:
            print(f"❌ Setup failed: {e}")
    
    def read_raw_value(self):
        """Read raw GPIO value"""
        try:
            with open(self.value_path, "r") as f:
                return int(f.read().strip())
        except:
            return None
    
    def calibrate_baseline(self):
        """Establish baseline when switch is not pressed"""
        print("🔧 Calibrating baseline...")
        print("Make sure switch is NOT pressed, then press Enter...")
        input()
        
        # Take multiple readings to establish baseline
        readings = []
        for i in range(10):
            reading = self.read_raw_value()
            if reading is not None:
                readings.append(reading)
            time.sleep(0.1)
        
        if readings:
            # Use most common value as baseline
            self.baseline_value = max(set(readings), key=readings.count)
            print(f"✅ Baseline established: {self.baseline_value}")
            return True
        else:
            print("❌ Could not establish baseline")
            return False
    
    def detect_press_pattern(self):
        """Detect button press by monitoring value changes"""
        print("🔘 Press Detection Active")
        print("Press the button to test...")
        print("Press Ctrl+C to exit")
        
        recent_values = []
        last_press_time = 0
        
        try:
            while True:
                current_value = self.read_raw_value()
                if current_value is not None:
                    recent_values.append(current_value)
                    
                    # Keep only last 10 readings
                    if len(recent_values) > 10:
                        recent_values.pop(0)
                    
                    # Look for value changes (press creates instability)
                    if len(recent_values) >= 5:
                        # Check if we have mixed values (indicating button press)
                        unique_values = set(recent_values[-5:])
                        current_time = time.time()
                        
                        if (len(unique_values) > 1 and 
                            current_time - last_press_time > 0.5):  # Debounce
                            
                            self.press_count += 1
                            timestamp = datetime.now().strftime("%H:%M:%S.%f")[:-3]
                            print(f"🔴 [{timestamp}] Button PRESSED (Count: {self.press_count})")
                            last_press_time = current_time
                
                time.sleep(0.05)
                
        except KeyboardInterrupt:
            print(f"\n🛑 Test stopped")
            print(f"Total presses detected: {self.press_count}")
    
    def cleanup(self):
        """Clean up GPIO"""
        try:
            with open("/sys/class/gpio/unexport", "w") as f:
                f.write(str(self.pin))
            print("✅ GPIO cleaned up")
        except:
            pass

def main():
    print("🔘 Switch Test - No External Resistor")
    print("=" * 40)
    print("This version works without pull-up resistor")
    print("by detecting value changes when button is pressed")
    print()
    
    switch = NoResistorSwitch(SWITCH_GPIO)
    
    if switch.calibrate_baseline():
        switch.detect_press_pattern()
    
    switch.cleanup()

if __name__ == "__main__":
    main()
