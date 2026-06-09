import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    ArrowLeft,
    Calendar,
    Mail,
    MessageCircle,
    User,
    Video,
} from 'lucide-react';
import AppNavbar from '../components/AppNavbar';
import { useChatStore } from '../store/useChatStore';
import { useSocketStore } from '../store/useSocketStore';
import { useAuthStore } from '../store/useAuthStore';
import { getApiErrorMessage } from '../lib/apiError';
import './UserProfilePage.css';

const UserProfilePage = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const { authUser } = useAuthStore();
    const { getUserById, setSelectedUser } = useChatStore();
    const { onlineUsers } = useSocketStore();

    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!userId) return;

        if (userId === authUser?._id) {
            navigate('/profile', { replace: true });
            return;
        }

        let cancelled = false;

        const loadUser = async () => {
            setIsLoading(true);
            setError('');
            try {
                const data = await getUserById(userId);
                if (!cancelled) setUser(data);
            } catch (err) {
                if (!cancelled) {
                    setError(getApiErrorMessage(err, 'Failed to load user profile'));
                }
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };

        loadUser();

        return () => {
            cancelled = true;
        };
    }, [userId, authUser?._id, getUserById, navigate]);

    const isOnline = user && onlineUsers.includes(user._id);

    const handleMessage = () => {
        if (!user) return;
        setSelectedUser(user);
        navigate('/');
    };

    const handleVideoCall = () => {
        if (!user) return;
        setSelectedUser(user);
        navigate('/', {
            state: { startVideoCall: true, callUserId: user._id },
        });
    };

    return (
        <div className="user-profile-layout">
            <AppNavbar />

            <div className="user-profile-page">
                <div className="user-profile-container">
                    {isLoading && (
                        <div className="user-profile-loading">Loading profile...</div>
                    )}

                    {error && !isLoading && (
                        <div className="user-profile-error-card">
                            <p className="user-profile-error">{error}</p>
                            <button className="user-profile-back-link" onClick={() => navigate(-1)}>
                                <ArrowLeft size={16} /> Go back
                            </button>
                        </div>
                    )}

                    {user && !isLoading && (
                        <div className="user-profile-card">
                            <div className="user-profile-banner">
                                <div className="user-profile-header">
                                    <button
                                        onClick={() => navigate(-1)}
                                        className="user-profile-back-btn"
                                        title="Go back"
                                    >
                                        <ArrowLeft size={20} />
                                    </button>
                                    <h1 className="user-profile-title">User Profile</h1>
                                </div>
                                <div className="banner-overlay" />
                            </div>

                            <div className="user-profile-body">
                                <div className="user-avatar-section">
                                    <div className="user-avatar-wrapper">
                                        <img
                                            src={user.profilePic || '/avatar.png'}
                                            alt={user.fullName}
                                            className="user-profile-avatar"
                                        />
                                        {isOnline && <span className="user-online-ring" />}
                                    </div>
                                    <h2 className="user-display-name">{user.fullName}</h2>
                                    <p className="user-handle">@{user.username}</p>
                                    <span className={`user-status-pill ${isOnline ? 'online' : 'offline'}`}>
                                        {isOnline ? 'Online' : 'Offline'}
                                    </span>
                                </div>

                                {user.description && (
                                    <div className="user-about-section">
                                        <h3 className="section-label">
                                            <User size={16} className="label-icon" />
                                            About
                                        </h3>
                                        <p className="user-about-text">{user.description}</p>
                                    </div>
                                )}

                                <div className="user-meta-section">
                                    <div className="user-meta-row">
                                        <span className="user-meta-label">
                                            <Mail size={16} />
                                            Username
                                        </span>
                                        <span className="user-meta-value">@{user.username}</span>
                                    </div>
                                    <div className="user-meta-row">
                                        <span className="user-meta-label">
                                            <Calendar size={16} />
                                            Member since
                                        </span>
                                        <span className="user-meta-value">
                                            {user.createdAt?.split('T')[0] || 'Unknown'}
                                        </span>
                                    </div>
                                </div>

                                <div className="user-actions">
                                    <button className="user-action-btn primary" onClick={handleMessage}>
                                        <MessageCircle size={18} />
                                        Send Message
                                    </button>
                                    <button className="user-action-btn secondary" onClick={handleVideoCall}>
                                        <Video size={18} />
                                        Video Call
                                    </button>
                                </div>

                                <p className="user-profile-hint">
                                    Start a private 1-to-1 conversation or video call with {user.fullName}.
                                </p>
                            </div>
                        </div>
                    )}

                    {!isLoading && !error && !user && (
                        <div className="user-profile-error-card">
                            <p className="user-profile-error">User not found.</p>
                            <Link to="/" className="user-profile-home-link">Back to messages</Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserProfilePage;
