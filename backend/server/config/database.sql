-- Simple test database schema for ARCIS
-- Create schema
CREATE SCHEMA IF NOT EXISTS arcis;
SET search_path TO arcis, public;

-- Simple test table
CREATE TABLE IF NOT EXISTS test_users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert some test data
INSERT INTO test_users (name, email) VALUES 
('John Doe', 'john@test.com'),
('Jane Smith', 'jane@test.com')
ON CONFLICT (email) DO NOTHING;
