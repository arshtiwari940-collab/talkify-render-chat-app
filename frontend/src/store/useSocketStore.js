import { create } from 'zustand';
import { io } from 'socket.io-client';
import { useAuthStore } from './useAuthStore';
import { useChatStore } from './useChatStore';

const BASE_URL = import.meta.env.MODE === "development" ? 'http://localhost:5000' : '/';

export const useSocketStore = create((set, get) => ({
    socket: null,
    onlineUsers: [],

    connectSocket: () => {
        const { authUser } = useAuthStore.getState();
        if (!authUser || get().socket?.connected) return;

        const socket = io(BASE_URL, {
            query: {
                userId: authUser._id,
            },
        });
        socket.connect();

        set({ socket: socket });

        socket.on('getOnlineUsers', (userIds) => {
            set({ onlineUsers: userIds });
        });

        socket.on('newMessage', (newMessage) => {
            const { selectedUser, messages } = useChatStore.getState();
            // Only update if the message is from the currently selected user
            const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser?._id;
            if (!isMessageSentFromSelectedUser) return;
            useChatStore.setState({ messages: [...messages, newMessage] });
        });

        // WEBRTC SIGNALING HANDLERS
        socket.on('incomingCall', (data) => {
            // Handled by webrtc store usually, or we can trigger it here
            // For simplicity we will handle it in a separate store or component
            // Actually we can just keep state here for incoming call
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
        if (get().socket?.connected) get().socket.disconnect();
    },

    // WebRTC State
    incomingCall: null,
    callAccepted: false,
    callEnded: false,
    callerSignal: null,

    resetCallState: () => set({ incomingCall: null, callAccepted: false, callEnded: false, callerSignal: null }),
    setCallAccepted: (val) => set({ callAccepted: val })
}));
