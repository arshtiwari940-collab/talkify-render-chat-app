import { db } from '../db/firebaseConfig.js';

const formatPublicUser = (id, userData) => ({
    _id: id,
    fullName: userData.fullName,
    username: userData.username,
    profilePic: userData.profilePic,
    description: userData.description || '',
    createdAt: userData.createdAt || '',
});

export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const loggedInUserId = req.user._id;

        if (!db) {
            return res.status(500).json({ error: 'Firestore not configured.' });
        }

        if (id === loggedInUserId) {
            return res.status(400).json({ error: 'Use profile settings for your own account.' });
        }

        const userDoc = await db.collection('users').doc(id).get();

        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User not found.' });
        }

        res.status(200).json(formatPublicUser(userDoc.id, userDoc.data()));
    } catch (error) {
        console.error('Error in getUserById: ', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getUsersForSidebar = async (req, res) => {
    try {
        const loggedInUserId = req.user._id;

        if (!db) {
            return res.status(500).json({ error: "Firestore not configured." });
        }

        // Fetch all users and filter out the logged in user
        const usersRef = db.collection('users');
        const snapshot = await usersRef.get();

        const filteredUsers = [];
        snapshot.forEach(doc => {
            if (doc.id !== loggedInUserId) {
                const userData = doc.data();
                delete userData.password;
                filteredUsers.push({
                    _id: doc.id,
                    ...userData
                });
            }
        });

        res.status(200).json(filteredUsers);
    } catch (error) {
        console.error('Error in getUsersForSidebar: ', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};
