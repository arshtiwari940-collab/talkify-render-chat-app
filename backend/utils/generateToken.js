import jwt from 'jsonwebtoken';
import { getAuthCookieOptions } from './cookieOptions.js';

const generateTokenAndSetCookie = (userId, res) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not configured');
    }

    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: '15d',
    });

    res.cookie('jwt', token, getAuthCookieOptions());
};

export default generateTokenAndSetCookie;
