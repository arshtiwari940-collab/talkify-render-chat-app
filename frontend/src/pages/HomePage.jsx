import React from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { useChatStore } from '../store/useChatStore';
import Sidebar from '../components/Sidebar';
import ChatContainer from '../components/ChatContainer';
import NoChatSelected from '../components/NoChatSelected';
import VideoCallModal from '../components/VideoCallModal';
import './HomePage.css';
import { LogOut, Monitor, Moon, Sun, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

const HomePage = () => {
    const { logout, authUser } = useAuthStore();
    const { theme, setTheme } = useThemeStore();
    const { selectedUser } = useChatStore(); // Will import after we build Sidebar and ChatContainer

    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    return (
        <div className="home-container">
            <nav className="navbar">
                <div className="navbar-brand">
                    <h2>Talkify</h2>
                </div>
                <div className="navbar-actions">
                    <span className="user-greeting">Hi, {authUser?.fullName}</span>
                    <button className="icon-btn theme-toggle" onClick={toggleTheme}>
                        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                    </button>
                    <Link to="/profile" className="btn btn-secondary">
                        <Settings size={16} /> <span className="hide-sm">Profile</span>
                    </Link>
                    <button className="btn btn-secondary logout-btn" onClick={logout}>
                        <LogOut size={16} /> <span className="hide-sm">Logout</span>
                    </button>
                </div>
            </nav>

            <main className="chat-layout">
                <div className={`sidebar-wrapper ${selectedUser ? "sidebar-hidden" : ""}`}>
                    <Sidebar />
                </div>
                <div className={`chat-wrapper ${!selectedUser ? "chat-hidden" : ""}`}>
                    {selectedUser ? <ChatContainer /> : <NoChatSelected />}
                </div>
            </main>

            {/* Global Video Call Overlay */}
            <VideoCallModal />
        </div>
    );
};

export default HomePage;
