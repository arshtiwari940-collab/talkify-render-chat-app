import { db } from '../db/firebaseConfig.js';

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
