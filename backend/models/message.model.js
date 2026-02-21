import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
    {
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        receiverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        message: {
            type: String,
            required: false,
        },
        mediaUrl: {
            type: String, // Cloudinary URL
            required: false,
        },
        mediaType: {
            type: String, // 'image' or 'video'
            required: false,
        }
    },
    { timestamps: true }
);

const Message = mongoose.model('Message', messageSchema);

export default Message;
