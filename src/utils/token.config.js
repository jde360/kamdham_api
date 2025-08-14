import jwt from 'jsonwebtoken';
import { appConfig } from './appConfig.js';

export const generateToken = (userId, email, userType) => {
    const token = jwt.sign(
        {
            userId,
            email,
            userType: userType || 'user'
        },
        appConfig.APP_KEY,
        { expiresIn: appConfig.EXPIRETIME }
    );
    return token;
}

export const verifyToken = (token) => {
    try {
        const decoded = jwt.verify(token, appConfig.APP_KEY);
        return decoded;
    } catch (error) {
        throw new Error('Invalid token');
    }
}
