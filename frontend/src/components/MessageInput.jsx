import React, { useEffect, useRef, useState } from 'react';
import { useChatStore } from '../store/useChatStore';
import { useSocketStore } from '../store/useSocketStore';
import { Image, Send, X } from 'lucide-react';
import './MessageInput.css';

const MessageInput = () => {
    const [text, setText] = useState('');
    const [mediaPreview, setMediaPreview] = useState(null);
    const [mediaFile, setMediaFile] = useState(null);
    const fileInputRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const { sendMessage, sendError, selectedUser } = useChatStore();
    const { emitTyping, emitStopTyping } = useSocketStore();

    const stopTyping = () => {
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
        }
        if (selectedUser) emitStopTyping(selectedUser._id);
    };

    useEffect(() => {
        return () => stopTyping();
    }, [selectedUser?._id]);

    const handleTextChange = (e) => {
        const value = e.target.value;
        setText(value);

        if (!selectedUser || !value.trim()) {
            stopTyping();
            return;
        }

        emitTyping(selectedUser._id);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            emitStopTyping(selectedUser._id);
            typingTimeoutRef.current = null;
        }, 2000);
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setMediaFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setMediaPreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const removeMedia = () => {
        setMediaPreview(null);
        setMediaFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!text.trim() && !mediaFile) return;

        stopTyping();

        try {
            const formData = new FormData();
            if (text.trim()) formData.append('message', text.trim());
            if (mediaFile) formData.append('media', mediaFile);

            await sendMessage(formData);

            setText('');
            removeMedia();
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    };

    return (
        <div className="message-input-container">
            {sendError && <div className="send-error">{sendError}</div>}
            {mediaPreview && (
                <div className="media-preview">
                    <div className="preview-wrapper">
                        <img src={mediaPreview} alt="Preview" />
                        <button
                            onClick={removeMedia}
                            className="remove-preview-btn btn btn-circle"
                            type="button"
                        >
                            <X size={12} />
                        </button>
                    </div>
                </div>
            )}

            <form onSubmit={handleSendMessage} className="input-form">
                <div className="input-with-actions">
                    <input
                        type="text"
                        className="chat-input"
                        placeholder="Type a message..."
                        value={text}
                        onChange={handleTextChange}
                        onBlur={stopTyping}
                    />
                    <input
                        type="file"
                        accept="image/*,video/*"
                        className="hidden-file-input"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                    />

                    <button
                        type="button"
                        className={`icon-btn action-btn ${mediaPreview ? 'active' : ''}`}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Image size={20} />
                    </button>

                    <button
                        type="submit"
                        className="icon-btn send-btn"
                        disabled={!text.trim() && !mediaPreview}
                    >
                        <Send size={20} />
                    </button>
                </div>
            </form>
        </div>
    );
};

export default MessageInput;
