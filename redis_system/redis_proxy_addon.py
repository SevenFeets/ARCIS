# Redis Proxy Add-on for server.py
# Add this to your existing server.py to proxy Redis through port 8000

from flask import request, jsonify
import redis
import json

# Add this to your server.py imports
# import redis

# Add this Redis client to your server.py
try:
    redis_client = redis.Redis(host='localhost', port=6379, decode_responses=True)
    REDIS_AVAILABLE = True
    print("✅ Redis proxy enabled")
except:
    REDIS_AVAILABLE = False
    print("⚠️ Redis proxy unavailable")

# Add these routes to your server.py

@app.route('/redis/ping', methods=['GET'])
def redis_ping():
    """Test Redis connection via HTTP proxy"""
    if not REDIS_AVAILABLE:
        return jsonify({'error': 'Redis not available'}), 503
    
    try:
        result = redis_client.ping()
        return jsonify({'status': 'success', 'result': result})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/redis/set', methods=['POST'])
def redis_set():
    """Set Redis key via HTTP proxy"""
    if not REDIS_AVAILABLE:
        return jsonify({'error': 'Redis not available'}), 503
    
    try:
        data = request.get_json()
        key = data.get('key')
        value = data.get('value')
        ttl = data.get('ttl', None)
        
        if ttl:
            result = redis_client.setex(key, ttl, value)
        else:
            result = redis_client.set(key, value)
            
        return jsonify({'status': 'success', 'result': result})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/redis/get', methods=['GET'])
def redis_get():
    """Get Redis key via HTTP proxy"""
    if not REDIS_AVAILABLE:
        return jsonify({'error': 'Redis not available'}), 503
    
    try:
        key = request.args.get('key')
        result = redis_client.get(key)
        return jsonify({'status': 'success', 'result': result})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/redis/publish', methods=['POST'])
def redis_publish():
    """Publish to Redis channel via HTTP proxy"""
    if not REDIS_AVAILABLE:
        return jsonify({'error': 'Redis not available'}), 503
    
    try:
        data = request.get_json()
        channel = data.get('channel')
        message = data.get('message')
        
        result = redis_client.publish(channel, json.dumps(message))
        return jsonify({'status': 'success', 'subscribers': result})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Add this to test the proxy
if __name__ == '__main__':
    print("🧪 Testing Redis proxy...")
    if REDIS_AVAILABLE:
        try:
            redis_client.ping()
            print("✅ Redis proxy working")
        except Exception as e:
            print(f"❌ Redis proxy failed: {e}")
    else:
        print("❌ Redis not available for proxy")