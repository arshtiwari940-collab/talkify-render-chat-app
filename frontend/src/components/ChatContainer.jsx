import React, { useEffect, useRef } from 'react';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import { useSocketStore } from '../store/useSocketStore';
import ChatHeader from './ChatHeader';
import MessageInput from './MessageInput';
import { formatMessageTime } from '../lib/utils';
import { Check, CheckCheck } from 'lucide-react';
import './ChatContainer.css';

const ChatContainer = () => {
    const {
        messages,
        getMessages,
        isMessagesLoading,
        messagesError,
        selectedUser,
        readReceipts,
        markMessagesAsRead,
    } = useChatStore();
    const { authUser } = useAuthStore();
    const { typingUsers } = useSocketStore();
    const messageEndRef = useRef(null);

    const isTyping = typingUsers.includes(selectedUser._id);

    useEffect(() => {
        getMessages(selectedUser._id);
    }, [selectedUser._id, getMessages]);

    useEffect(() => {
        if (messageEndRef.current && messages) {
            messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isTyping]);

    useEffect(() => {
        if (!messages.length || !selectedUser || !authUser) return;

        const incomingIds = messages
            .filter((m) => m.senderId !== authUser._id && m._id)
            .map((m) => m._id);

        if (incomingIds.length) {
            markMessagesAsRead(incomingIds, selectedUser._id);
        }
    }, [messages, selectedUser._id, authUser?._id, markMessagesAsRead]);

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
                {messagesError && <div className="chat-error">{messagesError}</div>}
                {messages.map((message) => {
                    const isSent = message.senderId === authUser._id;
                    const isRead = isSent && readReceipts.has(message._id);

                    return (
                        <div
                            key={message._id}
                            className={`chat-message ${isSent ? 'sent' : 'received'}`}
                        >
                            <div className="chat-image avatar">
                                <img
                                    src={
                                        isSent
                                            ? authUser.profilePic || '/avatar.png'
                                            : selectedUser.profilePic || '/avatar.png'
                                    }
                                    alt="profile pic"
                                />
                            </div>
                            <div className="chat-content">
                                <div className="chat-bubble">
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
                                    {isSent && (
                                        <span className={`read-receipt ${isRead ? 'read' : ''}`} title={isRead ? 'Read' : 'Sent'}>
                                            {isRead ? <CheckCheck size={14} /> : <Check size={14} />}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {isTyping && (
                    <div className="typing-indicator" aria-live="polite">
                        <div className="typing-dots">
                            <span />
                            <span />
                            <span />
                        </div>
                        <span className="typing-label">{selectedUser.fullName} is typing</span>
                    </div>
                )}

                <div ref={messageEndRef} />
            </div>

            <MessageInput />
        </div>
    );
};

export default ChatContainer;
