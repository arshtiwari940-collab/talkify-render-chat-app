import bcrypt from 'bcryptjs';
import { db } from '../db/firebaseConfig.js';
import generateTokenAndSetCookie from '../utils/generateToken.js';
import cloudinary from '../utils/cloudinary.js';

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

        res.status(201).json({
            _id: newUserDoc.id,
            fullName: newUserData.fullName,
            username: newUserData.username,
            profilePic: newUserData.profilePic,
        });

    } catch (error) {
        console.log("Error in signup controller", error.message);
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

        res.status(200).json({
            _id: userDoc.id,
            fullName: user.fullName,
            username: user.username,
            profilePic: user.profilePic,
        });
    } catch (error) {
        console.log("Error in login controller", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const logout = (req, res) => {
    try {
        res.cookie("jwt", "", { maxAge: 0 });
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

        let profilePicUrl = req.user.profilePic;

        if (req.file) {
            const b64 = Buffer.from(req.file.buffer).toString("base64");
            let dataURI = "data:" + req.file.mimetype + ";base64," + b64;

            const cldRes = await cloudinary.uploader.upload(dataURI, {
                resource_type: "auto",
            });

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

        res.status(200).json({
            _id: updatedUserDoc.id,
            fullName: updatedUser.fullName,
            username: updatedUser.username,
            profilePic: updatedUser.profilePic,
            description: updatedUser.description || "",
        });
    } catch (error) {
        console.log("Error in update profile", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
