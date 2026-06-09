import { create } from 'zustand';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../lib/config';
import { useAuthStore } from './useAuthStore';
import { useChatStore } from './useChatStore';

export const useSocketStore = create((set, get) => ({
    socket: null,
    onlineUsers: [],
    typingUsers: [],

    connectSocket: () => {
        const { authUser } = useAuthStore.getState();
        if (!authUser) return;

        const existing = get().socket;
        if (existing?.connected) return;
        if (existing) {
            existing.removeAllListeners();
            existing.disconnect();
        }

        const socket = io(SOCKET_URL, {
            query: {
                userId: authUser._id,
            },
            withCredentials: true,
            transports: ['websocket', 'polling'],
        });
        socket.connect();

        set({ socket: socket, typingUsers: [] });
        useChatStore.getState().refreshChatMeta();

        socket.on('getOnlineUsers', (userIds) => {
            set({ onlineUsers: userIds });
        });

        socket.on('newMessage', (newMessage) => {
            const chatStore = useChatStore.getState();
            const { selectedUser, users } = chatStore;
            const sender = users.find((u) => u._id === newMessage.senderId) || {
                _id: newMessage.senderId,
                fullName: 'User',
            };

            const isActiveChat = newMessage.senderId === selectedUser?._id;
            chatStore.recordConversationActivity(sender, newMessage, {
                incrementUnread: !isActiveChat,
            });

            if (isActiveChat) {
                useChatStore.setState((state) => ({
                    messages: [...state.messages, newMessage],
                }));

                const unreadIds = [newMessage._id];
                if (unreadIds.length) {
                    chatStore.markMessagesAsRead(unreadIds, newMessage.senderId);
                }
            }
        });

        socket.on('userTyping', ({ from }) => {
            set((state) => ({
                typingUsers: state.typingUsers.includes(from)
                    ? state.typingUsers
                    : [...state.typingUsers, from],
            }));
        });

        socket.on('userStoppedTyping', ({ from }) => {
            set((state) => ({
                typingUsers: state.typingUsers.filter((id) => id !== from),
            }));
        });

        socket.on('messagesRead', ({ messageIds }) => {
            if (messageIds?.length) {
                useChatStore.getState().applyReadReceipts(messageIds);
            }
        });

        socket.on('userProfileUpdated', ({ userId, profilePic, fullName, description }) => {
            // Update the users list so sidebar/chat header shows new profile pic immediately
            useChatStore.setState((state) => ({
                users: state.users.map((u) =>
                    u._id === userId ? { ...u, profilePic, fullName, description } : u
                ),
                // Also update selectedUser if it's the one who changed their profile
                selectedUser:
                    state.selectedUser?._id === userId
                        ? { ...state.selectedUser, profilePic, fullName, description }
                        : state.selectedUser,
            }));
        });

        socket.on('incomingCall', (data) => {
            set({ incomingCall: data });
        });

        socket.on('callEnded', () => {
            set({ callEnded: true, incomingCall: null, callAccepted: false });
        });

        socket.on('callAccepted', (signal) => {
            set({ callAccepted: true, callerSignal: signal });
        });
    },

    disconnectSocket: () => {
        const socket = get().socket;
        if (socket) {
            socket.removeAllListeners();
            socket.disconnect();
        }
        set({ socket: null, onlineUsers: [], typingUsers: [] });
    },

    emitTyping: (toUserId) => {
        const socket = get().socket;
        if (socket?.connected && toUserId) {
            socket.emit('typing', { to: toUserId });
        }
    },

    emitStopTyping: (toUserId) => {
        const socket = get().socket;
        if (socket?.connected && toUserId) {
            socket.emit('stopTyping', { to: toUserId });
        }
    },

    incomingCall: null,
    callAccepted: false,
    callEnded: false,
    callerSignal: null,

    resetCallState: () => set({ incomingCall: null, callAccepted: false, callEnded: false, callerSignal: null }),
    setCallAccepted: (val) => set({ callAccepted: val }),
}));
