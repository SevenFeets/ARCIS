#!/usr/bin/env python3
"""
Debounced Switch Button for Jetson Nano
Prevents false triggers from mechanical switch bounce
"""

import Jetson.GPIO as GPIO
import time
from datetime import datetime

# GPIO Configuration
SWITCH_PIN = 19  # Pin 35 (GPIO 19) - Working pin
DEBOUNCE_TIME = 0.2  # 200ms debounce time

class DebouncedSwitch:
    def __init__(self, pin, debounce_time=0.2):
        self.pin = pin
        self.debounce_time = debounce_time
        self.last_state = None
        self.last_change_time = 0
        self.press_count = 0
        
        # Setup GPIO
        GPIO.setmode(GPIO.BCM)
        GPIO.setup(self.pin, GPIO.IN, pull_up_down=GPIO.PUD_UP)
        
        # Initialize state
        self.last_state = GPIO.input(self.pin)
        print(f"✅ Switch initialized on GPIO {self.pin}")
        print(f"Initial state: {'OPEN' if self.last_state else 'CLOSED'}")
    
    def read_switch(self):
        """Read switch with debouncing"""
        current_time = time.time()
        current_state = GPIO.input(self.pin)
        
        # Check if state changed and debounce time has passed
        if (current_state != self.last_state and 
            current_time - self.last_change_time > self.debounce_time):
            
            self.last_state = current_state
            self.last_change_time = current_time
            
            if current_state == GPIO.LOW:  # Switch closed (pressed)
                self.press_count += 1
                return "PRESSED"
            else:  # Switch open (released)
                return "RELEASED"
        
        return None  # No state change or still in debounce period
    
    def is_pressed(self):
        """Check if switch is currently pressed"""
        return GPIO.input(self.pin) == GPIO.LOW
    
    def cleanup(self):
        """Clean up GPIO"""
        GPIO.cleanup()

def main():
    print("🔘 Debounced Switch Test")
    print("=" * 30)
    
    switch = DebouncedSwitch(SWITCH_PIN, DEBOUNCE_TIME)
    
    print("Press the switch button to test debouncing...")
    print("Press Ctrl+C to exit")
    
    try:
        while True:
            switch_event = switch.read_switch()
            
            if switch_event == "PRESSED":
                timestamp = datetime.now().strftime("%H:%M:%S.%f")[:-3]
                print(f"🔴 [{timestamp}] Switch PRESSED (Count: {switch.press_count})")
                
            elif switch_event == "RELEASED":
                timestamp = datetime.now().strftime("%H:%M:%S.%f")[:-3]
                print(f"🟢 [{timestamp}] Switch RELEASED")
            
            time.sleep(0.01)  # Small delay
            
    except KeyboardInterrupt:
        print("\n🛑 Test stopped")
        print(f"Total button presses: {switch.press_count}")
    finally:
        switch.cleanup()
        print("✅ GPIO cleaned up")

if __name__ == "__main__":
    main()
