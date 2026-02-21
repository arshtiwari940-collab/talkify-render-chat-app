import { create } from 'zustand';
import axios from 'axios';
import { useSocketStore } from './useSocketStore';

// Create an axio instance
export const axiosInstance = axios.create({
    baseURL: import.meta.env.MODE === "development" ? 'http://localhost:5000/api' : '/api',
    withCredentials: true, // Send cookies with requests
});

export const useAuthStore = create((set, get) => ({
    authUser: null,
    isCheckingAuth: true,
    isLoggingIn: false,
    isUpdatingProfile: false,

    checkAuth: async () => {
        try {
            const res = await axiosInstance.get('/auth/check');
            set({ authUser: res.data });
            useSocketStore.getState().connectSocket();
        } catch (error) {
            console.log('Error in checkAuth', error.message);
            set({ authUser: null });
        } finally {
            set({ isCheckingAuth: false });
        }
    },

    signup: async (data) => {
        try {
            const res = await axiosInstance.post('/auth/signup', data);
            set({ authUser: res.data });
            useSocketStore.getState().connectSocket();
        } catch (error) {
            console.error('Error signing up', error);
            throw error;
        }
    },

    login: async (data) => {
        set({ isLoggingIn: true });
        try {
            const res = await axiosInstance.post('/auth/login', data);
            set({ authUser: res.data });
            useSocketStore.getState().connectSocket();
        } catch (error) {
            console.error('Error logging in', error);
            throw error;
        } finally {
            set({ isLoggingIn: false });
        }
    },

    logout: async () => {
        try {
            await axiosInstance.post('/auth/logout');
            set({ authUser: null });
            useSocketStore.getState().disconnectSocket();
        } catch (error) {
            console.error('Error logging out', error);
        }
    },

    updateProfile: async (data) => {
        set({ isUpdatingProfile: true });
        try {
            const res = await axiosInstance.put('/auth/update-profile', data, {
                headers: {
                    "Content-Type": "multipart/form-data",
                }
            });
            set({ authUser: res.data });
        } catch (error) {
            console.error('Error updating profile', error);
            throw error;
        } finally {
            set({ isUpdatingProfile: false });
        }
    },
}));
