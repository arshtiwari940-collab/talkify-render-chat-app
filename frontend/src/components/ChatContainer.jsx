import React, { useEffect, useRef } from 'react';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import ChatHeader from './ChatHeader';
import MessageInput from './MessageInput';
import { formatMessageTime } from '../lib/utils';
import './ChatContainer.css';

const ChatContainer = () => {
    const { messages, getMessages, isMessagesLoading, selectedUser } = useChatStore();
    const { authUser } = useAuthStore();
    const messageEndRef = useRef(null);

    useEffect(() => {
        getMessages(selectedUser._id);
    }, [selectedUser._id, getMessages]);

    useEffect(() => {
        if (messageEndRef.current && messages) {
            messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    if (isMessagesLoading) {
        return (
            <div className="chat-container">
                <ChatHeader />
                <div className="chat-loading">Loading messages...</div>
                <MessageInput />
            </div>
        );
    }

    return (
        <div className="chat-container">
            <ChatHeader />

            <div className="chat-messages">
                {messages.map((message) => (
                    <div
                        key={message._id}
                        className={`chat-message ${message.senderId === authUser._id ? 'sent' : 'received'}`}
                    >
                        <div className="chat-image avatar">
                            <img
                                src={
                                    message.senderId === authUser._id
                                        ? authUser.profilePic || '/avatar.png'
                                        : selectedUser.profilePic || '/avatar.png'
                                }
                                alt="profile pic"
                            />
                        </div>
                        <div className="chat-content">
                            <div className="chat-bubble flex flex-col">
                                {message.mediaUrl && message.mediaType === 'image' && (
                                    <img
                                        src={message.mediaUrl}
                                        alt="Attachment"
                                        className="message-attachment"
                                    />
                                )}
                                {message.mediaUrl && message.mediaType === 'video' && (
                                    <video
                                        src={message.mediaUrl}
                                        controls
                                        className="message-attachment"
                                    />
                                )}
                                {message.message && <p>{message.message}</p>}
                            </div>
                            <div className="chat-footer">
                                <time>{formatMessageTime(message.createdAt)}</time>
                            </div>
                        </div>
                    </div>
                ))}
                <div ref={messageEndRef} />
            </div>

            <MessageInput />
        </div>
    );
};

export default ChatContainer;
