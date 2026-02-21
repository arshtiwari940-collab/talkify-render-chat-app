import { create } from 'zustand';

export const useThemeStore = create((set) => ({
    theme: localStorage.getItem('theme-chat') || 'dark', // default to dark
    setTheme: (theme) => {
        localStorage.setItem('theme-chat', theme);
        set({ theme });
    },
}));
