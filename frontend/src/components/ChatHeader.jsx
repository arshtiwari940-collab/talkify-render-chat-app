import React from 'react';
import { Link } from 'react-router-dom';
import { useChatStore } from '../store/useChatStore';
import { useSocketStore } from '../store/useSocketStore';
import { X, Video, ArrowLeft } from 'lucide-react';
import './ChatHeader.css';

const ChatHeader = () => {
    const { selectedUser, setSelectedUser } = useChatStore();
    const { onlineUsers, typingUsers } = useSocketStore();

    const isOnline = onlineUsers.includes(selectedUser._id);
    const isTyping = typingUsers.includes(selectedUser._id);

    const handleVideoCall = () => {
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
                <Link
                    to={`/user/${selectedUser._id}`}
                    className="header-profile-link"
                    title="View profile"
                >
                    <div className="avatar-wrapper">
                        <img src={selectedUser.profilePic || '/avatar.png'} alt={selectedUser.fullName} className="avatar" />
                        {isOnline && <span className="online-indicator" />}
                    </div>
                    <div className="user-details">
                        <h3 className="user-name">{selectedUser.fullName}</h3>
                        <span className={`user-status ${isTyping ? 'typing' : isOnline ? 'online' : 'offline'}`}>
                            {isTyping ? 'Typing...' : isOnline ? 'Online' : 'Offline'}
                        </span>
                    </div>
                </Link>
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
