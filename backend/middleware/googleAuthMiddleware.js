const { OAuth2Client } = require('google-auth-library');

// Ensure GOOGLE_CLIENT_ID exists
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
if (!GOOGLE_CLIENT_ID) {
    throw new Error('GOOGLE_CLIENT_ID environment variable is required');
}

const client = new OAuth2Client(GOOGLE_CLIENT_ID);

async function verifyGoogleToken(idToken, googleId) {
    if (!idToken || !googleId) {
        return {
            verified: false,
            error: 'Missing required parameters'
        };
    }

    try {
        const ticket = await client.verifyIdToken({
            idToken,
            audience: GOOGLE_CLIENT_ID,
        });
        
        const payload = ticket.getPayload();
        
        // Enhanced validation
        if (!payload) {
            throw new Error('Invalid token payload');
        }
        
        if (payload.sub !== googleId) {
            return {
                verified: false,
                error: 'Google ID mismatch',
                code: 'ID_MISMATCH'
            };
        }

        // Verify token expiration
        const currentTime = Math.floor(Date.now() / 1000);
        if (payload.exp < currentTime) {
            return {
                verified: false,
                error: 'Token expired',
                code: 'TOKEN_EXPIRED'
            };
        }
        
        return {
            verified: true,
            payload,
            code: 'SUCCESS'
        };
    } catch (error) {
        console.error('Google token verification error:', {
            message: error.message,
            stack: error.stack
        });
        
        return {
            verified: false,
            error: error.message,
            code: 'VERIFICATION_ERROR'
        };
    }
}

module.exports = verifyGoogleToken;
