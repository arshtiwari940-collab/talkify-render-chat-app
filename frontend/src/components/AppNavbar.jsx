import React from 'react';
import { Link } from 'react-router-dom';
import { LogOut, Moon, Sun, Settings } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import './AppNavbar.css';

const AppNavbar = () => {
    const { logout, authUser } = useAuthStore();
    const { theme, setTheme } = useThemeStore();

    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    return (
        <nav className="app-navbar">
            <div className="app-navbar-brand">
                <Link to="/" className="app-navbar-logo">Talkify</Link>
            </div>
            <div className="app-navbar-actions">
                <span className="app-navbar-greeting">Hi, {authUser?.fullName}</span>
                <button className="app-navbar-icon-btn" onClick={toggleTheme} title="Toggle theme">
                    {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </button>
                <Link to="/profile" className="app-navbar-btn">
                    <Settings size={16} /> <span className="hide-sm">Profile</span>
                </Link>
                <button className="app-navbar-btn" onClick={logout}>
                    <LogOut size={16} /> <span className="hide-sm">Logout</span>
                </button>
            </div>
        </nav>
    );
};

export default AppNavbar;
