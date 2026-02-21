import React, { useEffect } from 'react';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import { Users, UserPlus } from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
    const { users, getUsers, selectedUser, setSelectedUser, isUsersLoading } = useChatStore();
    const { authUser } = useAuthStore();
    // online users logic will be added via socket store later
    const onlineUsers = [];

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

            <div className="user-list">
                {users.map((user) => (
                    <button
                        key={user._id}
                        className={`user-item ${selectedUser?._id === user._id ? 'selected' : ''}`}
                        onClick={() => setSelectedUser(user)}
                    >
                        <div className="avatar-wrapper">
                            <img src={user.profilePic || '/avatar.png'} alt={user.fullName} className="avatar" />
                            {onlineUsers.includes(user._id) && <span className="online-indicator" />}
                        </div>
                        <div className="user-info text-left min-w-0">
                            <div className="user-name">{user.fullName}</div>
                            <div className="user-status text-sm text-zinc-400">
                                {onlineUsers.includes(user._id) ? "Online" : "Offline"}
                            </div>
                        </div>
                    </button>
                ))}

                {users.length === 0 && (
                    <div className="no-users">No users found</div>
                )}
            </div>
        </aside>
    );
};

export default Sidebar;
