import bcrypt from 'bcryptjs';
import { db } from '../db/firebaseConfig.js';
import generateTokenAndSetCookie from '../utils/generateToken.js';
import { getClearAuthCookieOptions } from '../utils/cookieOptions.js';
import cloudinary from '../utils/cloudinary.js';
import { io } from '../socket/socket.js';

const formatAuthUser = (id, user) => ({
    _id: id,
    fullName: user.fullName,
    username: user.username,
    profilePic: user.profilePic,
    description: user.description || '',
    createdAt: user.createdAt || '',
});

export const signup = async (req, res) => {
    try {
        const { fullName, username, password, confirmPassword, gender } = req.body;

        // We assume db is initialized properly; if not, return error early
        if (!db) return res.status(500).json({ error: "Firestore not initialized. Add serviceAccountKey.json and configure .env" });

        if (password !== confirmPassword) {
            return res.status(400).json({ error: "Passwords don't match" });
        }

        const usersRef = db.collection('users');
        const snapshot = await usersRef.where('username', '==', username).get();

        if (!snapshot.empty) {
            return res.status(400).json({ error: "Username already exists" });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const boyProfilePic = `https://avatar.iran.liara.run/public/boy?username=${username}`;
        const girlProfilePic = `https://avatar.iran.liara.run/public/girl?username=${username}`;

        const newUserDoc = usersRef.doc();
        const newUserData = {
            fullName,
            username,
            password: hashedPassword,
            gender,
            profilePic: gender === "male" ? boyProfilePic : girlProfilePic,
            createdAt: new Date().toISOString()
        };

        await newUserDoc.set(newUserData);

        // Generate JWT token
        generateTokenAndSetCookie(newUserDoc.id, res);

        res.status(201).json(formatAuthUser(newUserDoc.id, newUserData));

    } catch (error) {
        console.log("Error in signup controller", error.message);
        if (error.message === 'JWT_SECRET is not configured') {
            return res.status(500).json({ error: 'Server misconfigured: JWT_SECRET is missing' });
        }
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!db) return res.status(500).json({ error: "Firestore not initialized." });

        const usersRef = db.collection('users');
        const snapshot = await usersRef.where('username', '==', username).get();

        if (snapshot.empty) {
            return res.status(400).json({ error: "Invalid username or password" });
        }

        const userDoc = snapshot.docs[0];
        const user = userDoc.data();

        const isPasswordCorrect = await bcrypt.compare(password, user?.password || "");

        if (!isPasswordCorrect) {
            return res.status(400).json({ error: "Invalid username or password" });
        }

        generateTokenAndSetCookie(userDoc.id, res);

        res.status(200).json(formatAuthUser(userDoc.id, user));
    } catch (error) {
        console.log("Error in login controller", error.message);
        if (error.message === 'JWT_SECRET is not configured') {
            return res.status(500).json({ error: 'Server misconfigured: JWT_SECRET is missing' });
        }
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const logout = (req, res) => {
    try {
        res.cookie('jwt', '', getClearAuthCookieOptions());
        res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        console.log("Error in logout controller", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const checkAuth = (req, res) => {
    try {
        res.status(200).json(req.user);
    } catch (error) {
        console.log("Error in checkAuth controller", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const { description } = req.body;
        const userId = req.user._id;

        if (!db) return res.status(500).json({ error: "Firestore not initialized." });

        // Validate Cloudinary config before trying to upload
        const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
        if (req.file && (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET)) {
            return res.status(500).json({ error: "Image upload is not configured. Please set Cloudinary credentials in .env" });
        }

        let profilePicUrl = req.user.profilePic;

        if (req.file) {
            const b64 = Buffer.from(req.file.buffer).toString("base64");
            let dataURI = "data:" + req.file.mimetype + ";base64," + b64;

            let cldRes;
            try {
                cldRes = await cloudinary.uploader.upload(dataURI, {
                    folder: 'talkify/avatars',
                    resource_type: "auto",
                });
            } catch (cloudErr) {
                console.error("Cloudinary upload error:", cloudErr.message || cloudErr);
                return res.status(500).json({ error: "Failed to upload image. Check your Cloudinary credentials in .env" });
            }

            profilePicUrl = cldRes.secure_url;
        }

        const userRef = db.collection('users').doc(userId);

        const updateData = {};
        if (profilePicUrl !== req.user.profilePic) updateData.profilePic = profilePicUrl;
        if (description !== undefined) updateData.description = description;

        if (Object.keys(updateData).length > 0) {
            await userRef.update(updateData);
        }

        const updatedUserDoc = await userRef.get();
        const updatedUser = updatedUserDoc.data();

        const responseUser = formatAuthUser(updatedUserDoc.id, updatedUser);

        // Broadcast profile update to all connected users so they see the new pic in real time
        if (updateData.profilePic || updateData.description !== undefined) {
            io.emit('userProfileUpdated', {
                userId,
                profilePic: responseUser.profilePic,
                fullName: responseUser.fullName,
                description: responseUser.description,
            });
        }

        res.status(200).json(responseUser);
    } catch (error) {
        console.error("Error in update profile:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
