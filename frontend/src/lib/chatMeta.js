const RECENT_KEY = (userId) => `talkify_recent_${userId}`;
const READ_KEY = (userId) => `talkify_read_${userId}`;

export const loadRecentConversations = (authUserId) => {
    try {
        const raw = localStorage.getItem(RECENT_KEY(authUserId));
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
};

export const saveRecentConversations = (authUserId, conversations) => {
    try {
        localStorage.setItem(RECENT_KEY(authUserId), JSON.stringify(conversations));
    } catch {
        /* ignore quota errors */
    }
};

export const loadReadReceipts = (authUserId) => {
    try {
        const raw = localStorage.getItem(READ_KEY(authUserId));
        return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
        return new Set();
    }
};

export const saveReadReceipts = (authUserId, readIds) => {
    try {
        localStorage.setItem(READ_KEY(authUserId), JSON.stringify([...readIds]));
    } catch {
        /* ignore */
    }
};

export const getMessagePreview = (message) => {
    if (message.message?.trim()) return message.message.trim();
    if (message.mediaType === 'image') return 'Photo';
    if (message.mediaType === 'video') return 'Video';
    return 'Attachment';
};

export const upsertRecentConversation = (authUserId, user, message, { incrementUnread = false } = {}) => {
    const conversations = loadRecentConversations(authUserId);
    const preview = getMessagePreview(message);
    const at = message.createdAt || new Date().toISOString();

    const existing = conversations.find((c) => c.userId === user._id);
    if (existing) {
        existing.fullName = user.fullName ?? existing.fullName;
        existing.username = user.username ?? existing.username;
        existing.profilePic = user.profilePic ?? existing.profilePic;
        existing.lastMessage = preview;
        existing.lastMessageAt = at;
        if (incrementUnread) existing.unreadCount = (existing.unreadCount || 0) + 1;
    } else {
        conversations.push({
            userId: user._id,
            fullName: user.fullName,
            username: user.username,
            profilePic: user.profilePic,
            lastMessage: preview,
            lastMessageAt: at,
            unreadCount: incrementUnread ? 1 : 0,
        });
    }

    conversations.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
    saveRecentConversations(authUserId, conversations);
    return conversations;
};

export const clearUnreadForUser = (authUserId, otherUserId) => {
    const conversations = loadRecentConversations(authUserId);
    const entry = conversations.find((c) => c.userId === otherUserId);
    if (entry) entry.unreadCount = 0;
    saveRecentConversations(authUserId, conversations);
    return conversations;
};

export const formatConversationTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    }
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) {
        return date.toLocaleDateString('en-US', { weekday: 'short' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};
