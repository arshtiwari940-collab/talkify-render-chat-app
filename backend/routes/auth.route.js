import express from 'express';
import { signup, login, logout, checkAuth, updateProfile } from '../controllers/auth.controller.js';
import protectRoute from '../middleware/protectRoute.js';
import multer from 'multer';

const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = express.Router();

router.get('/check', protectRoute, checkAuth);

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.put('/update-profile', protectRoute, upload.single('profilePic'), updateProfile);

export default router;
