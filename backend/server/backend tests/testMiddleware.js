const express = require('express');
const arcjetMiddleware = require('../../middleware/arcjet');
const { verifyToken, requireRole, requireClearance } = require('../../middleware/auth');
const { validateUser } = require('../../middleware/validations');

const app = express();
app.use(express.json());

// Test 1: Rate limiting
app.get('/api/test/rate-limit', arcjetMiddleware, (req, res) => {
    res.json({ message: 'Rate limiting works!', timestamp: new Date() });
});

// Test 2: Validation
app.post('/api/test/validation', validateUser, (req, res) => {
    res.json({ message: 'Validation passed!', data: req.body });
});

// Test 3: Auth (we'll add this after we create login)
app.get('/api/test/auth', verifyToken, (req, res) => {
    res.json({ message: 'Authentication works!', user: req.user.username });
});

// Test 4: Role-based access
app.get('/api/test/commander-only', verifyToken, requireRole(['commander', 'admin']), (req, res) => {
    res.json({ message: 'Commander access granted!', clearance: 'TOP SECRET' });
});

const PORT = 3002;
app.listen(PORT, () => {
    console.log(`🧪 Middleware test server running on port ${PORT}`);
    console.log('📋 Test endpoints:');
    console.log(`   GET  http://localhost:${PORT}/api/test/rate-limit`);
    console.log(`   POST http://localhost:${PORT}/api/test/validation`);
    console.log(`   GET  http://localhost:${PORT}/api/test/auth (needs token)`);
    console.log(`   GET  http://localhost:${PORT}/api/test/commander-only (needs commander token)`);
}); 