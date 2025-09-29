const { verifyToken: jwtVerify } = require('../utils/jwt');

function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ success: false, error: 'No autorizado. Falta token.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwtVerify(token);

    if (!decoded) {
        return res.status(401).json({ success: false, error: 'Token inválido o expirado.' });
    }

    req.user = decoded;
    next();
}

module.exports = { verifyToken };
