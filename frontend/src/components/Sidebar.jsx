import React, { useEffect } from 'react';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import { useSocketStore } from '../store/useSocketStore';
import { Users, UserPlus, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
    const { users, getUsers, selectedUser, setSelectedUser, isUsersLoading, usersError, recentConversations } = useChatStore();

    const getConversationMeta = (userId) =>
        recentConversations.find((c) => c.userId === userId);
    const { authUser } = useAuthStore();
    const { onlineUsers, typingUsers } = useSocketStore();

    useEffect(() => {
        getUsers();
    }, [getUsers]);

    const handleInviteClick = () => {
        const inviteLink = `${window.location.origin}/signup?invite=${authUser.username}`;
        navigator.clipboard.writeText(inviteLink);
        alert("Invite link copied to clipboard: " + inviteLink);
    };

    if (isUsersLoading) return <div className="sidebar-loading">Loading users...</div>;

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="flex items-center gap-2">
                    <Users size={20} className="icon" />
                    <h3>Messages</h3>
                </div>
                <button
                    onClick={handleInviteClick}
                    className="invite-btn"
                    title="Copy Invite Link"
                >
                    <UserPlus size={18} />
                </button>
            </div>

            {usersError && <div className="sidebar-error">{usersError}</div>}

            <div className="user-list">
                {users.map((user) => {
                    const meta = getConversationMeta(user._id);
                    const isTyping = typingUsers.includes(user._id);

                    return (
                    <div
                        key={user._id}
                        className={`user-item ${selectedUser?._id === user._id ? 'selected' : ''}`}
                    >
                        <button
                            type="button"
                            className="user-item-main"
                            onClick={() => setSelectedUser(user)}
                        >
                            <div className="avatar-wrapper">
                                <img src={user.profilePic || '/avatar.png'} alt={user.fullName} className="avatar" />
                                {onlineUsers.includes(user._id) && <span className="online-indicator" />}
                            </div>
                            <div className="user-info">
                                <div className="user-name-row">
                                    <span className="user-name">{user.fullName}</span>
                                    {meta?.unreadCount > 0 && (
                                        <span className="user-unread-badge">{meta.unreadCount}</span>
                                    )}
                                </div>
                                <div className={`user-status ${isTyping ? 'typing' : ''}`}>
                                    {isTyping
                                        ? 'Typing...'
                                        : meta?.lastMessage
                                          ? meta.lastMessage
                                          : onlineUsers.includes(user._id)
                                            ? 'Online'
                                            : 'Offline'}
                                </div>
                            </div>
                        </button>
                        <Link
                            to={`/user/${user._id}`}
                            className="user-profile-btn"
                            title="View profile"
                        >
                            <Info size={16} />
                        </Link>
                    </div>
                    );
                })}

                {users.length === 0 && !usersError && (
                    <div className="no-users">No users found</div>
                )}
            </div>
        </aside>
    );
};

export default Sidebar;
