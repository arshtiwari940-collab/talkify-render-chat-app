import React from 'react';
import { MessageSquare } from 'lucide-react';
import './NoChatSelected.css';

const NoChatSelected = () => {
    return (
        <div className="no-chat-container">
            <div className="no-chat-content animate-fade-in">
                <div className="icon-wrapper">
                    <MessageSquare size={48} className="bounce-animation" />
                </div>
                <h2>Welcome to RealtimeChat!</h2>
                <p>Select a conversation from the sidebar to start chatting</p>
            </div>
        </div>
    );
};

export default NoChatSelected;
