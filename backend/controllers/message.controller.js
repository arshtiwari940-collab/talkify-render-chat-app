import { getReceiverSocketId, io } from '../socket/socket.js';
import cloudinary from '../utils/cloudinary.js';
import { db } from '../db/firebaseConfig.js';

export const sendMessage = async (req, res) => {
    try {
        const { message } = req.body;
        const { id: receiverId } = req.params;
        const senderId = req.user._id;

        if (!db) return res.status(500).json({ error: "Firestore not configured." });

        let mediaUrl = null;
        let mediaType = null;

        if (req.file) {
            const b64 = Buffer.from(req.file.buffer).toString("base64");
            let dataURI = "data:" + req.file.mimetype + ";base64," + b64;

            const cldRes = await cloudinary.uploader.upload(dataURI, {
                resource_type: "auto",
            });

            mediaUrl = cldRes.secure_url;
            mediaType = cldRes.resource_type;
        }

        // Create deterministic conversation ID
        const convoId = [senderId, receiverId].sort().join('_');
        const convoRef = db.collection('conversations').doc(convoId);

        const messageData = {
            senderId,
            receiverId,
            message: message || "",
            mediaUrl,
            mediaType,
            createdAt: new Date().toISOString()
        };

        // Run in transaction to ensure conversation exists
        await db.runTransaction(async (transaction) => {
            const convoDoc = await transaction.get(convoRef);
            if (!convoDoc.exists) {
                transaction.set(convoRef, {
                    participants: [senderId, receiverId],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                });
            } else {
                transaction.update(convoRef, {
                    updatedAt: new Date().toISOString()
                });
            }

            const newMessageRef = convoRef.collection('messages').doc();
            transaction.set(newMessageRef, messageData);

            // Append id
            messageData._id = newMessageRef.id;
        });

        // SOCKET IO FUNCTIONALITY
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('newMessage', messageData);
        }

        res.status(201).json(messageData);
    } catch (error) {
        console.log('Error in sendMessage controller: ', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getMessages = async (req, res) => {
    try {
        const { id: userToChatId } = req.params;
        const senderId = req.user._id;

        if (!db) return res.status(500).json({ error: "Firestore not configured." });

        const convoId = [senderId, userToChatId].sort().join('_');
        const messagesRef = db.collection('conversations').doc(convoId).collection('messages');

        const snapshot = await messagesRef.orderBy('createdAt', 'asc').get();

        if (snapshot.empty) return res.status(200).json([]);

        const messages = [];
        snapshot.forEach(doc => {
            messages.push({
                _id: doc.id,
                ...doc.data()
            });
        });

        res.status(200).json(messages);
    } catch (error) {
        console.log('Error in getMessages controller: ', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};
