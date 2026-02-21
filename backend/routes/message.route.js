import express from 'express';
import protectRoute from '../middleware/protectRoute.js';
import { sendMessage, getMessages } from '../controllers/message.controller.js';
import multer from 'multer';

// Use memory storage for multer
const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = express.Router();

router.get('/:id', protectRoute, getMessages);
router.post('/send/:id', protectRoute, upload.single('media'), sendMessage);

export default router;
