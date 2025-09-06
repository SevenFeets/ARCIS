#!/usr/bin/env python3
"""
Combined GPS and Switch Test
Tests both GPS module and switch button together
"""

import serial
import pynmea2
import os
import time
import threading
from datetime import datetime

# GPS Configuration
GPS_PORT = '/dev/ttyTHS1'
GPS_BAUD = 9600

# Switch Configuration
SWITCH_GPIO = 19
SWITCH_PATH = f"/sys/class/gpio/gpio{SWITCH_GPIO}"

class GPSSwitchSystem:
    def __init__(self):
        self.running = False
        self.gps_serial = None
        self.switch_setup = False
        self.gps_data = {}
        self.switch_pressed = False
        
    def setup_switch(self):
        """Setup switch using sysfs"""
        try:
            if not os.path.exists(SWITCH_PATH):
                with open("/sys/class/gpio/export", "w") as f:
                    f.write(str(SWITCH_GPIO))
            
            with open(f"{SWITCH_PATH}/direction", "w") as f:
                f.write("in")
            
            self.switch_setup = True
            print("✅ Switch setup complete")
            return True
        except Exception as e:
            print(f"❌ Switch setup failed: {e}")
            return False
    
    def read_switch(self):
        """Read switch state"""
        if not self.switch_setup:
            return False
        try:
            with open(f"{SWITCH_PATH}/value", "r") as f:
                return int(f.read().strip()) == 0  # LOW when pressed
        except:
            return False
    
    def setup_gps(self):
        """Setup GPS serial connection"""
        try:
            self.gps_serial = serial.Serial(GPS_PORT, GPS_BAUD, timeout=1)
            print("✅ GPS setup complete")
            return True
        except Exception as e:
            print(f"❌ GPS setup failed: {e}")
            return False
    
    def gps_worker(self):
        """GPS data reading worker thread"""
        while self.running:
            try:
                if self.gps_serial and self.gps_serial.in_waiting > 0:
                    line = self.gps_serial.readline().decode('ascii', errors='replace').strip()
                    
                    if line.startswith('$'):
                        msg = pynmea2.parse(line)
                        
                        if hasattr(msg, 'sentence_type'):
                            if msg.sentence_type == 'RMC':
                                self.gps_data['status'] = msg.status
                                self.gps_data['lat'] = msg.lat
                                self.gps_data['lon'] = msg.lon
                                self.gps_data['time'] = msg.datetime
                            elif msg.sentence_type == 'GGA':
                                self.gps_data['satellites'] = msg.num_sats
                                self.gps_data['fix_quality'] = msg.gps_qual
                                
            except Exception as e:
                pass
            
            time.sleep(0.1)
    
    def switch_worker(self):
        """Switch monitoring worker thread"""
        last_state = False
        
        while self.running:
            try:
                current_state = self.read_switch()
                
                if current_state != last_state:
                    timestamp = datetime.now().strftime("%H:%M:%S")
                    
                    if current_state:
                        print(f"🔴 [{timestamp}] SWITCH PRESSED")
                        self.on_switch_pressed()
                    else:
                        print(f"🟢 [{timestamp}] SWITCH RELEASED")
                    
                    last_state = current_state
                    
            except Exception as e:
                pass
            
            time.sleep(0.01)
    
    def on_switch_pressed(self):
        """Action when switch is pressed"""
        # Print current GPS status
        status = self.gps_data.get('status', 'V')
        satellites = self.gps_data.get('satellites', 0)
        
        if status == 'A':
            lat = self.gps_data.get('lat', 'N/A')
            lon = self.gps_data.get('lon', 'N/A')
            print(f"📍 GPS Position: {lat}, {lon}")
        else:
            print(f"🛰️ GPS Status: Searching... ({satellites} satellites)")
    
    def status_worker(self):
        """Status display worker"""
        while self.running:
            try:
                status = self.gps_data.get('status', 'V')
                satellites = self.gps_data.get('satellites', 0)
                switch_state = "PRESSED" if self.read_switch() else "RELEASED"
                
                gps_status = "🟢 GPS FIX" if status == 'A' else f"🔴 SEARCHING ({satellites} sats)"
                
                print(f"\r📊 Status: {gps_status} | Switch: {switch_state}", end="", flush=True)
                
            except:
                pass
            
            time.sleep(2)
    
    def start(self):
        """Start the combined system"""
        print("🚀 GPS + Switch System Starting")
        print("=" * 40)
        
        if not self.setup_switch():
            return
        
        if not self.setup_gps():
            return
        
        self.running = True
        
        # Start worker threads
        gps_thread = threading.Thread(target=self.gps_worker, daemon=True)
        switch_thread = threading.Thread(target=self.switch_worker, daemon=True)
        status_thread = threading.Thread(target=self.status_worker, daemon=True)
        
        gps_thread.start()
        switch_thread.start()
        status_thread.start()
        
        print("✅ All systems running")
        print("Press switch to see GPS status")
        print("Press Ctrl+C to exit")
        
        try:
            while self.running:
                time.sleep(1)
        except KeyboardInterrupt:
            print(f"\n🛑 Stopping system...")
            self.running = False
            
        self.cleanup()
    
    def cleanup(self):
        """Clean up resources"""
        if self.gps_serial:
            self.gps_serial.close()
        
        if self.switch_setup:
            try:
                with open("/sys/class/gpio/unexport", "w") as f:
                    f.write(str(SWITCH_GPIO))
            except:
                pass
        
        print("✅ Cleanup complete")

if __name__ == "__main__":
    system = GPSSwitchSystem()
    system.start()
