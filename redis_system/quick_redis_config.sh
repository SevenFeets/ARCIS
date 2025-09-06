#!/bin/bash
# Quick Redis Configuration for ARCIS
# Run this to fix the Redis config issue

echo "🔧 Applying ARCIS Redis configuration..."

# Create the minimal Redis config for ARCIS
sudo tee /etc/redis/redis.conf > /dev/null << 'EOF'
# Redis configuration for ARCIS Weapon Detection System

# Network - Allow connections from Pi4 and Jetson
bind 0.0.0.0
port 6379

# Memory management  
maxmemory 256mb
maxmemory-policy allkeys-lru

# Performance for tactical environment
save ""
appendonly no
timeout 0
tcp-keepalive 300

# Logging
loglevel notice
logfile /var/log/redis/redis-server.log

# Performance optimizations
hz 10
tcp-backlog 511
EOF

# Set proper permissions
sudo chown redis:redis /etc/redis/redis.conf

# Restart Redis to apply config
sudo systemctl restart redis-server

# Check status
echo "📊 Redis status:"
sudo systemctl is-active redis-server

echo "🧪 Testing Redis connection:"
redis-cli ping

echo "✅ Redis configuration completed!"
echo "📡 Redis is now accessible from Pi4 and Jetson on port 6379"