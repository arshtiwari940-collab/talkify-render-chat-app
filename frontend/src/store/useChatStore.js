import { create } from 'zustand';
import { axiosInstance } from './useAuthStore';
import { getApiErrorMessage } from '../lib/apiError';
import {
    clearUnreadForUser,
    loadRecentConversations,
    loadReadReceipts,
    saveReadReceipts,
    upsertRecentConversation,
} from '../lib/chatMeta';
import { useAuthStore } from './useAuthStore';
import { useSocketStore } from './useSocketStore';

const initChatMeta = () => {
    const authUser = useAuthStore.getState().authUser;
    if (!authUser) return { recentConversations: [], readReceipts: new Set() };
    return {
        recentConversations: loadRecentConversations(authUser._id),
        readReceipts: loadReadReceipts(authUser._id),
    };
};

export const useChatStore = create((set, get) => ({
    messages: [],
    users: [],
    selectedUser: null,
    isUsersLoading: false,
    isMessagesLoading: false,
    usersError: null,
    messagesError: null,
    sendError: null,
    recentConversations: initChatMeta().recentConversations,
    readReceipts: initChatMeta().readReceipts,
    isHydratingRecents: false,

    refreshChatMeta: () => {
        const authUser = useAuthStore.getState().authUser;
        if (!authUser) return;
        set({
            recentConversations: loadRecentConversations(authUser._id),
            readReceipts: loadReadReceipts(authUser._id),
        });
    },

    recordConversationActivity: (user, message, { incrementUnread = false } = {}) => {
        const authUser = useAuthStore.getState().authUser;
        if (!authUser || !user?._id) return;

        const conversations = upsertRecentConversation(authUser._id, user, message, { incrementUnread });
        set({ recentConversations: conversations });
    },

    clearUnread: (userId) => {
        const authUser = useAuthStore.getState().authUser;
        if (!authUser) return;
        const conversations = clearUnreadForUser(authUser._id, userId);
        set({ recentConversations: conversations });
    },

    markMessagesAsRead: (messageIds, fromUserId) => {
        const authUser = useAuthStore.getState().authUser;
        const socket = useSocketStore.getState().socket;
        if (!authUser || !messageIds?.length || !fromUserId) return;

        socket?.emit('markMessagesRead', { messageIds, fromUserId });
    },

    applyReadReceipts: (messageIds) => {
        const authUser = useAuthStore.getState().authUser;
        if (!authUser || !messageIds?.length) return;

        const readReceipts = new Set(get().readReceipts);
        messageIds.forEach((id) => readReceipts.add(id));
        saveReadReceipts(authUser._id, readReceipts);
        set({ readReceipts });
    },

    getUsers: async () => {
        set({ isUsersLoading: true, usersError: null });
        try {
            const res = await axiosInstance.get('/users');
            set({ users: res.data });
        } catch (error) {
            const message = getApiErrorMessage(error, 'Failed to load users');
            console.error('Error in getUsers', message);
            set({ usersError: message });
        } finally {
            set({ isUsersLoading: false });
        }
    },

    getMessages: async (userId) => {
        set({ isMessagesLoading: true, messagesError: null });
        try {
            const res = await axiosInstance.get(`/messages/${userId}`);
            const messages = res.data;
            set({ messages });

            const authUser = useAuthStore.getState().authUser;
            const { users, selectedUser } = get();
            const user = selectedUser || users.find((u) => u._id === userId);
            if (messages.length > 0 && user) {
                get().recordConversationActivity(user, messages[messages.length - 1]);
            }
        } catch (error) {
            const message = getApiErrorMessage(error, 'Failed to load messages');
            console.error('Error in getMessages', message);
            set({ messagesError: message, messages: [] });
        } finally {
            set({ isMessagesLoading: false });
        }
    },

    hydrateRecentConversations: async () => {
        const authUser = useAuthStore.getState().authUser;
        const { users, recentConversations, isHydratingRecents } = get();
        if (!authUser || isHydratingRecents || recentConversations.length > 0 || users.length === 0) return;

        set({ isHydratingRecents: true });
        try {
            const results = await Promise.all(
                users.slice(0, 15).map(async (user) => {
                    try {
                        const res = await axiosInstance.get(`/messages/${user._id}`);
                        if (res.data.length === 0) return null;
                        return { user, lastMessage: res.data[res.data.length - 1] };
                    } catch {
                        return null;
                    }
                })
            );

            results.filter(Boolean).forEach(({ user, lastMessage }) => {
                get().recordConversationActivity(user, lastMessage);
            });
        } finally {
            set({ isHydratingRecents: false });
        }
    },

    getUserById: async (userId) => {
        const res = await axiosInstance.get(`/users/${userId}`);
        return res.data;
    },

    sendMessage: async (messageData) => {
        const { selectedUser, messages } = get();
        set({ sendError: null });
        try {
            const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
            set({ messages: [...messages, res.data] });
            get().recordConversationActivity(selectedUser, res.data);
        } catch (error) {
            const message = getApiErrorMessage(error, 'Failed to send message');
            console.error('Error in sendMessage', message);
            set({ sendError: message });
            throw error;
        }
    },

    setSelectedUser: (selectedUser) => {
        if (selectedUser) {
            get().clearUnread(selectedUser._id);
        }
        set({ selectedUser, messagesError: null, sendError: null });
    },
}));
