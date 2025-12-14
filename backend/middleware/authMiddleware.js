const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

// Improve error handling and logging
const verifyToken = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ 
                error: 'Authentication token missing',
                code: 'NO_TOKEN'
            });
        }
        
        jwt.verify(token, JWT_SECRET, (err, decoded) => {
            if (err) {
                console.error('Token verification failed:', err.message);
                return res.status(401).json({ 
                    error: 'Invalid or expired token',
                    code: err.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN'
                });
            }
            
            req.userId = decoded.id;
            next();
        });
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({ 
            error: 'Authentication error',
            code: 'AUTH_ERROR'
        });
    }
};

module.exports = { verifyToken, JWT_SECRET };