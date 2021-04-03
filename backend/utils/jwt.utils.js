// Imports
const jwt = require('jsonwebtoken');
const JWT_SIGN_SECRET = '05dfgbf6tmwpadn84toxnz861anj0dejvmm';

// Exported functions
module.exports = {
    generateTokenForUser: function(userData) {
        return jwt.sign({
            userId: userData.id,
            isAdmin: userData.isAdmin
        },
        JWT_SIGN_SECRET,
        {
            expiresIn: '24h'
        })
    }
}