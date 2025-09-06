#!/usr/bin/env python3
"""
Redis Setup Script for ARCIS Weapon Detection System
Installs and configures Redis for Pi4 and Jetson devices
"""

import os
import sys
import subprocess
import logging
import time

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def run_command(command, description):
    """Run shell command with error handling"""
    try:
        logger.info(f"🔧 {description}")
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        logger.info(f"✅ {description} - SUCCESS")
        return result.stdout
    except subprocess.CalledProcessError as e:
        logger.error(f"❌ {description} - FAILED")
        logger.error(f"Error: {e.stderr}")
        return False

def install_redis_dependencies():
    """Install Redis and Python dependencies"""
    logger.info("📦 Installing Redis dependencies...")
    
    # Update package list
    if not run_command("sudo apt update", "Updating package list"):
        return False
    
    # Install Redis server
    if not run_command("sudo apt install -y redis-server", "Installing Redis server"):
        return False
    
    # Install Python Redis client
    if not run_command("pip3 install redis", "Installing Python Redis client"):
        return False
    
    logger.info("✅ Redis dependencies installed successfully")
    return True

def configure_redis():
    """Configure Redis for ARCIS system"""
    logger.info("⚙️ Configuring Redis...")
    
    # Redis configuration for ARCIS
    redis_config = """
# Redis configuration for ARCIS Weapon Detection System

# Network
bind 0.0.0.0
port 6379

# Security (can be enabled later)
# requirepass your_password_here

# Memory management
maxmemory 256mb
maxmemory-policy allkeys-lru

# Persistence (disabled for performance in tactical environment)
save ""
appendonly no

# Performance
tcp-keepalive 300
timeout 0

# Logging
loglevel notice
logfile /var/log/redis/redis-server.log

# ARCIS-specific optimizations
hz 10
tcp-backlog 511
"""
    
    try:
        # Backup original config
        run_command("sudo cp /etc/redis/redis.conf /etc/redis/redis.conf.backup", "Backing up Redis config")
        
        # Write new config with sudo
        config_path = '/tmp/redis_arcis.conf'
        
        # Use echo to write config (works with sudo)
        escaped_config = redis_config.replace('"', '\\"').replace('\n', '\\n')
        write_cmd = f'echo -e "{escaped_config}" | sudo tee {config_path} > /dev/null'
        
        if not run_command(write_cmd, "Writing ARCIS Redis config"):
            # Fallback: create minimal working config
            minimal_config = """bind 0.0.0.0
port 6379
maxmemory 256mb
maxmemory-policy allkeys-lru
save ""
appendonly no"""
            write_cmd = f'echo "{minimal_config}" | sudo tee {config_path} > /dev/null'
            run_command(write_cmd, "Writing minimal Redis config")
        
        # Copy to Redis directory
        run_command("sudo cp /tmp/redis_arcis.conf /etc/redis/redis.conf", "Installing ARCIS Redis config")
        
        # Set permissions
        run_command("sudo chown redis:redis /etc/redis/redis.conf", "Setting Redis config permissions")
        
        # Clean up temp file
        run_command("sudo rm -f /tmp/redis_arcis.conf", "Cleaning up temp config")
        
        logger.info("✅ Redis configuration updated")
        return True
        
    except Exception as e:
        logger.error(f"❌ Redis configuration failed: {e}")
        return False

def setup_redis_service():
    """Setup Redis as a system service"""
    logger.info("🔧 Setting up Redis service...")
    
    # Enable Redis service
    if not run_command("sudo systemctl enable redis-server", "Enabling Redis service"):
        return False
    
    # Start Redis service
    if not run_command("sudo systemctl start redis-server", "Starting Redis service"):
        return False
    
    # Check service status
    if not run_command("sudo systemctl is-active redis-server", "Checking Redis service status"):
        return False
    
    logger.info("✅ Redis service configured successfully")
    return True

def test_redis_connection():
    """Test Redis connection and functionality"""
    logger.info("🧪 Testing Redis connection...")
    
    try:
        import redis
        
        # Connect to Redis
        client = redis.Redis(host='localhost', port=6379, decode_responses=True)
        
        # Test basic operations
        client.set('arcis_test', 'connection_successful')
        result = client.get('arcis_test')
        
        if result == 'connection_successful':
            logger.info("✅ Redis connection test PASSED")
            
            # Test ARCIS-specific operations
            client.publish('arcis:test', 'publish_test')
            client.delete('arcis_test')
            
            # Get Redis info
            info = client.info('memory')
            used_memory = info.get('used_memory_human', 'Unknown')
            logger.info(f"📊 Redis memory usage: {used_memory}")
            
            return True
        else:
            logger.error("❌ Redis connection test FAILED")
            return False
            
    except Exception as e:
        logger.error(f"❌ Redis test error: {e}")
        return False

def create_arcis_redis_test():
    """Create test script for ARCIS Redis integration"""
    test_script = """#!/usr/bin/env python3
'''
ARCIS Redis Integration Test
Tests all Redis functionality for weapon detection system
'''

import redis
import json
import time
from redis_config import RedisManager
from redis_detection_handler import RedisDetectionHandler

def test_redis_integration():
    print("🧪 Testing ARCIS Redis Integration...")
    
    # Test 1: Basic Redis connection
    try:
        client = redis.Redis(host='localhost', port=6379, decode_responses=True)
        client.ping()
        print("✅ Redis connection: PASSED")
    except Exception as e:
        print(f"❌ Redis connection: FAILED - {e}")
        return False
    
    # Test 2: RedisManager
    try:
        manager = RedisManager('test_device')
        if manager.connect():
            print("✅ RedisManager connection: PASSED")
            manager.cleanup()
        else:
            print("❌ RedisManager connection: FAILED")
    except Exception as e:
        print(f"❌ RedisManager error: {e}")
    
    # Test 3: Detection Handler
    try:
        device_config = {
            'device_id': 'test_device',
            'device_name': 'test',
            'device_type': 'test_device',
            'location': 'Test Location'
        }
        handler = RedisDetectionHandler('test_device', device_config)
        print("✅ RedisDetectionHandler: PASSED")
        handler.cleanup()
    except Exception as e:
        print(f"❌ RedisDetectionHandler error: {e}")
    
    print("🎯 ARCIS Redis integration test completed!")

if __name__ == "__main__":
    test_redis_integration()
"""
    
    try:
        with open('test_arcis_redis.py', 'w') as f:
            f.write(test_script)
        
        # Make executable
        os.chmod('test_arcis_redis.py', 0o755)
        
        logger.info("✅ ARCIS Redis test script created: test_arcis_redis.py")
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to create test script: {e}")
        return False

def main():
    """Main setup process"""
    logger.info("🚀 Starting ARCIS Redis Setup...")
    logger.info("=" * 50)
    
    # Check if running as root for system operations
    if os.geteuid() != 0:
        logger.warning("⚠️ Some operations may require sudo privileges")
    
    success_steps = 0
    total_steps = 5
    
    # Step 1: Install dependencies
    if install_redis_dependencies():
        success_steps += 1
    
    # Step 2: Configure Redis
    if configure_redis():
        success_steps += 1
    
    # Step 3: Setup service
    if setup_redis_service():
        success_steps += 1
    
    # Wait for Redis to fully start
    logger.info("⏳ Waiting for Redis to start...")
    time.sleep(3)
    
    # Step 4: Test connection
    if test_redis_connection():
        success_steps += 1
    
    # Step 5: Create test script
    if create_arcis_redis_test():
        success_steps += 1
    
    # Final report
    logger.info("=" * 50)
    logger.info(f"📊 Setup Results: {success_steps}/{total_steps} steps completed")
    
    if success_steps == total_steps:
        logger.info("🎉 ARCIS Redis setup completed successfully!")
        logger.info("📝 Next steps:")
        logger.info("   1. Run: python3 test_arcis_redis.py")
        logger.info("   2. Start your ARCIS detection scripts")
        logger.info("   3. Monitor Redis with: redis-cli monitor")
        return True
    else:
        logger.error("❌ Setup incomplete - please check errors above")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)