import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useChatStore } from '../store/useChatStore';
import Sidebar from '../components/Sidebar';
import ChatContainer from '../components/ChatContainer';
import NoChatSelected from '../components/NoChatSelected';
import VideoCallModal from '../components/VideoCallModal';
import AppNavbar from '../components/AppNavbar';
import './HomePage.css';

const HomePage = () => {
    const { selectedUser } = useChatStore();
    const location = useLocation();

    useEffect(() => {
        const state = location.state;
        if (state?.startVideoCall && state?.callUserId) {
            window.dispatchEvent(
                new CustomEvent('start-video-call', { detail: { id: state.callUserId } })
            );
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    return (
        <div className="home-container">
            <AppNavbar />

            <main className="chat-layout">
                <div className={`sidebar-wrapper ${selectedUser ? 'sidebar-hidden' : ''}`}>
                    <Sidebar />
                </div>
                <div className={`chat-wrapper ${!selectedUser ? 'chat-hidden' : ''}`}>
                    {selectedUser ? <ChatContainer /> : <NoChatSelected />}
                </div>
            </main>

            <VideoCallModal />
        </div>
    );
};

export default HomePage;
