import React from 'react';
import { useChatStore } from '../store/useChatStore';
import { X, Video, ArrowLeft } from 'lucide-react';
import './ChatHeader.css';

const ChatHeader = () => {
    const { selectedUser, setSelectedUser } = useChatStore();

    const handleVideoCall = () => {
        // Initialize the getUserMedia first via state change or dispatch event
        window.dispatchEvent(new CustomEvent('start-video-call', { detail: { id: selectedUser._id } }));
    };

    return (
        <div className="chat-header">
            <div className="header-info">
                <button
                    className="icon-btn action-btn back-btn-mobile"
                    onClick={() => setSelectedUser(null)}
                    title="Back to Messages"
                >
                    <ArrowLeft size={20} />
                </button>
                <div className="avatar-wrapper">
                    <img src={selectedUser.profilePic || '/avatar.png'} alt={selectedUser.fullName} className="avatar" />
                    <span className="online-indicator" /> {/* Assuming online for now */}
                </div>
                <div className="user-details">
                    <h3 className="user-name">{selectedUser.fullName}</h3>
                    <span className="user-status">Online</span>
                </div>
            </div>

            <div className="header-actions">
                <button className="icon-btn action-btn" onClick={handleVideoCall} title="Start Video Call">
                    <Video size={20} />
                </button>
                <button className="icon-btn action-btn close-btn" onClick={() => setSelectedUser(null)} title="Close Chat">
                    <X size={20} />
                </button>
            </div>
        </div>
    );
};

export default ChatHeader;
