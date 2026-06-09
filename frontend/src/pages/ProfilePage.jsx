import React, { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';
import {
    Camera,
    User,
    FileText,
    ArrowLeft,
    Mail,
    Calendar,
    ShieldCheck,
    MessageCircle,
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { getApiErrorMessage } from '../lib/apiError';
import { formatConversationTime } from '../lib/chatMeta';
import AppNavbar from '../components/AppNavbar';
import './ProfilePage.css';

const ProfilePage = () => {
    const { authUser, isUpdatingProfile, updateProfile } = useAuthStore();
    const {
        users,
        getUsers,
        setSelectedUser,
        recentConversations,
        isHydratingRecents,
        hydrateRecentConversations,
        refreshChatMeta,
    } = useChatStore();
    const [selectedImage, setSelectedImage] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [description, setDescription] = useState(authUser?.description || '');
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        refreshChatMeta();
        getUsers();
    }, [getUsers, refreshChatMeta]);

    useEffect(() => {
        if (users.length > 0) {
            hydrateRecentConversations();
        }
    }, [users.length, hydrateRecentConversations]);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setImageFile(file);
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            setSelectedImage(reader.result);
        };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const formData = new FormData();
            if (imageFile) formData.append('profilePic', imageFile);
            if (description !== authUser?.description) formData.append('description', description);

            await updateProfile(formData);

            setImageFile(null);
            setSelectedImage(null);
        } catch (err) {
            setError(getApiErrorMessage(err, 'Failed to update profile'));
        }
    };

    const handleOpenChat = (conv) => {
        const user = users.find((u) => u._id === conv.userId) || {
            _id: conv.userId,
            fullName: conv.fullName,
            profilePic: conv.profilePic,
            username: conv.username,
        };
        setSelectedUser(user);
        navigate('/');
    };

    const hasChanges = imageFile || description !== (authUser?.description || '');

    return (
        <div className="profile-layout">
            <AppNavbar />

            <div className="profile-page">
                <div className="profile-container">
                    <div className="profile-card">
                        <div className="profile-banner">
                            <div className="profile-header">
                                <button onClick={() => navigate(-1)} className="profile-back-btn" title="Go back">
                                    <ArrowLeft size={20} />
                                </button>
                                <h1 className="profile-title">Profile Settings</h1>
                            </div>
                            <div className="banner-overlay" />
                        </div>

                        <form onSubmit={handleSubmit} className="profile-form">
                            {error && <div className="profile-error">{error}</div>}

                            <div className="avatar-section">
                                <div className="avatar-upload-wrapper">
                                    <img
                                        src={selectedImage || authUser?.profilePic || '/avatar.png'}
                                        alt="Profile"
                                        className="profile-avatar"
                                    />
                                    <label
                                        htmlFor="avatar-upload"
                                        className={`avatar-upload-label ${isUpdatingProfile ? 'disabled' : ''}`}
                                    >
                                        <Camera size={20} />
                                        <input
                                            type="file"
                                            id="avatar-upload"
                                            className="avatar-file-input"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            disabled={isUpdatingProfile}
                                            ref={fileInputRef}
                                        />
                                    </label>
                                </div>
                                <p className="profile-subtitle">
                                    {isUpdatingProfile ? 'Uploading...' : 'Click the camera icon to update your photo'}
                                </p>
                            </div>

                            <div className="info-grid">
                                <div className="form-group glass-input-wrap">
                                    <label className="input-label">
                                        <User size={16} className="label-icon" />
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        className="premium-input"
                                        value={authUser?.fullName || ''}
                                        readOnly
                                    />
                                </div>

                                <div className="form-group glass-input-wrap">
                                    <label className="input-label">
                                        <Mail size={16} className="label-icon" />
                                        Username
                                    </label>
                                    <input
                                        type="text"
                                        className="premium-input"
                                        value={`@${authUser?.username || ''}`}
                                        readOnly
                                    />
                                </div>
                            </div>

                            <div className="form-group glass-input-wrap about-field">
                                <label className="input-label">
                                    <FileText size={16} className="label-icon" />
                                    About
                                </label>
                                <textarea
                                    className="premium-input description-input"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Tell the world about yourself..."
                                    rows={3}
                                />
                            </div>

                            <button
                                type="submit"
                                className="profile-save-btn"
                                disabled={isUpdatingProfile || !hasChanges}
                            >
                                {isUpdatingProfile ? 'Saving Changes...' : 'Save Changes'}
                            </button>
                        </form>

                        <div className="recent-conversations">
                            <h2 className="recent-conversations-title">
                                <MessageCircle size={20} className="label-icon" />
                                Recent Conversations
                            </h2>

                            {isHydratingRecents && recentConversations.length === 0 && (
                                <p className="recent-empty">Loading your chats...</p>
                            )}

                            {!isHydratingRecents && recentConversations.length === 0 && (
                                <p className="recent-empty">
                                    No conversations yet.{' '}
                                    <Link to="/" className="profile-link">Start chatting</Link>
                                </p>
                            )}

                            <ul className="recent-list">
                                {recentConversations.slice(0, 8).map((conv) => (
                                    <li key={conv.userId}>
                                        <button
                                            type="button"
                                            className="recent-item"
                                            onClick={() => handleOpenChat(conv)}
                                        >
                                            <img
                                                src={conv.profilePic || '/avatar.png'}
                                                alt={conv.fullName}
                                                className="recent-avatar"
                                            />
                                            <div className="recent-info">
                                                <div className="recent-top">
                                                    <span className="recent-name">{conv.fullName}</span>
                                                    <time className="recent-time">
                                                        {formatConversationTime(conv.lastMessageAt)}
                                                    </time>
                                                </div>
                                                <p className="recent-preview">{conv.lastMessage}</p>
                                            </div>
                                            {conv.unreadCount > 0 && (
                                                <span className="recent-unread">{conv.unreadCount}</span>
                                            )}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="account-details">
                            <h2 className="account-details-title">
                                <ShieldCheck size={20} className="label-icon" />
                                Account Status
                            </h2>
                            <div className="detail-row">
                                <span className="detail-label">
                                    <Calendar size={16} />
                                    Member Since
                                </span>
                                <span className="detail-value">
                                    {authUser?.createdAt?.split('T')[0] || 'Unknown'}
                                </span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Status</span>
                                <div className="status-badge">
                                    <span className="dot" />
                                    Active
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
