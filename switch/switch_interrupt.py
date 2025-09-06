#!/usr/bin/env python3
"""
Switch Button with Interrupt Handling for Jetson Nano
More efficient - only triggers on state changes
"""

import Jetson.GPIO as GPIO
import time
import signal
import sys
from datetime import datetime

# GPIO Configuration
SWITCH_PIN = 19  # Pin 35 (GPIO 19) - Working pin

class InterruptSwitch:
    def __init__(self, pin):
        self.pin = pin
        self.press_count = 0
        self.last_press_time = 0
        self.debounce_time = 0.2  # 200ms debounce
        
        # Setup GPIO
        GPIO.setmode(GPIO.BCM)
        GPIO.setup(self.pin, GPIO.IN, pull_up_down=GPIO.PUD_UP)
        
        # Setup interrupt on both rising and falling edges
        GPIO.add_event_detect(self.pin, GPIO.BOTH, callback=self.switch_callback, bouncetime=200)
        
        print(f"✅ Interrupt switch initialized on GPIO {self.pin}")
        print(f"Initial state: {'OPEN' if GPIO.input(self.pin) else 'CLOSED'}")
    
    def switch_callback(self, channel):
        """Callback function for switch state changes"""
        current_time = time.time()
        current_state = GPIO.input(channel)
        timestamp = datetime.now().strftime("%H:%M:%S.%f")[:-3]
        
        if current_state == GPIO.LOW:  # Switch pressed
            # Additional debouncing check
            if current_time - self.last_press_time > self.debounce_time:
                self.press_count += 1
                self.last_press_time = current_time
                print(f"🔴 [{timestamp}] Switch PRESSED (Count: {self.press_count})")
                
                # Add your custom action here
                self.on_switch_pressed()
        else:  # Switch released
            print(f"🟢 [{timestamp}] Switch RELEASED")
            
            # Add your custom action here
            self.on_switch_released()
    
    def on_switch_pressed(self):
        """Custom action when switch is pressed"""
        print("   ⚡ Action: Switch pressed!")
        # Add your custom logic here
    
    def on_switch_released(self):
        """Custom action when switch is released"""
        print("   ⚡ Action: Switch released!")
        # Add your custom logic here
    
    def is_pressed(self):
        """Check if switch is currently pressed"""
        return GPIO.input(self.pin) == GPIO.LOW
    
    def cleanup(self):
        """Clean up GPIO"""
        GPIO.cleanup()

def signal_handler(sig, frame):
    """Handle Ctrl+C gracefully"""
    print('\n🛑 Exiting...')
    GPIO.cleanup()
    sys.exit(0)

def main():
    print("🔘 Interrupt-Based Switch Test")
    print("=" * 35)
    print("Press the switch button to trigger interrupts...")
    print("Press Ctrl+C to exit")
    
    # Setup signal handler for graceful exit
    signal.signal(signal.SIGINT, signal_handler)
    
    switch = InterruptSwitch(SWITCH_PIN)
    
    try:
        # Main loop - can do other work here
        while True:
            # The switch handling is done via interrupts
            # You can do other work here without blocking
            time.sleep(1)
            
            # Optional: Print status every 10 seconds
            if int(time.time()) % 10 == 0:
                state = "PRESSED" if switch.is_pressed() else "OPEN"
                print(f"📊 Status: Switch {state}, Total presses: {switch.press_count}")
                time.sleep(1)  # Prevent multiple prints in same second
            
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        switch.cleanup()
        print("✅ GPIO cleaned up")

if __name__ == "__main__":
    main()
