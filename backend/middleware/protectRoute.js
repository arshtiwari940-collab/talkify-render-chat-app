import jwt from 'jsonwebtoken';
import { db } from '../db/firebaseConfig.js';

const protectRoute = async (req, res, next) => {
    try {
        const token = req.cookies.jwt;

        if (!token) {
            return res.status(401).json({ error: 'Unauthorized - No Token Provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded) {
            return res.status(401).json({ error: 'Unauthorized - Invalid Token' });
        }

        if (!db) {
            return res.status(500).json({ error: "Firestore not configured." });
        }

        const userDoc = await db.collection('users').doc(decoded.userId).get();

        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userData = userDoc.data();
        delete userData.password;

        req.user = {
            _id: userDoc.id,
            ...userData
        };

        next();
    } catch (error) {
        console.log('Error in protectRoute middleware: ', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export default protectRoute;
