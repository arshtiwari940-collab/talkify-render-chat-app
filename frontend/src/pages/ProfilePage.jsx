import React, { useRef, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Camera, User, FileText, ArrowLeft, Mail, Calendar, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './ProfilePage.css';

const ProfilePage = () => {
    const { authUser, isUpdatingProfile, updateProfile } = useAuthStore();
    const [selectedImage, setSelectedImage] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [description, setDescription] = useState(authUser?.description || '');
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setImageFile(file);
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            setSelectedImage(reader.result);
        };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const formData = new FormData();
            if (imageFile) formData.append('profilePic', imageFile);
            if (description !== authUser?.description) formData.append('description', description);

            await updateProfile(formData);

            // Optionally clear file selection state
            setImageFile(null);
            setSelectedImage(null);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="profile-page h-screen pt-20">
            <div className="profile-container max-w-3xl mx-auto p-4 py-8">
                <div className="profile-card premium-glass">
                    <div className="profile-header">
                        <button onClick={() => navigate(-1)} className="back-btn btn-circle glass-btn">
                            <ArrowLeft size={20} />
                        </button>
                        <h1 className="text-2xl font-bold gradient-text">Profile Settings</h1>
                    </div>

                    <div className="profile-banner">
                        <div className="banner-overlay"></div>
                    </div>

                    <form onSubmit={handleSubmit} className="profile-form">
                        {/* Avatar upload section */}
                        <div className="avatar-section">
                            <div className="avatar-upload-wrapper">
                                <img
                                    src={selectedImage || authUser.profilePic || "/avatar.png"}
                                    alt="Profile"
                                    className="profile-avatar shadow-glow"
                                />
                                <label
                                    htmlFor="avatar-upload"
                                    className={`avatar-upload-label glass-btn ${isUpdatingProfile ? "disabled" : ""}`}
                                >
                                    <Camera className="w-5 h-5" />
                                    <input
                                        type="file"
                                        id="avatar-upload"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        disabled={isUpdatingProfile}
                                        ref={fileInputRef}
                                    />
                                </label>
                            </div>
                            <p className="text-sm profile-subtitle">
                                {isUpdatingProfile ? "Uploading..." : "Click the camera icon to update your photo"}
                            </p>
                        </div>

                        {/* User info sections */}
                        <div className="info-grid">
                            <div className="form-group glass-input-wrap">
                                <label className="input-label">
                                    <User className="size-4 text-accent" />
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    className="form-input premium-input"
                                    value={authUser?.fullName}
                                    readOnly
                                />
                            </div>

                            <div className="form-group glass-input-wrap">
                                <label className="input-label">
                                    <Mail className="size-4 text-accent" />
                                    Username
                                </label>
                                <input
                                    type="text"
                                    className="form-input premium-input"
                                    value={'@' + authUser?.username}
                                    readOnly
                                />
                            </div>
                        </div>

                        <div className="form-group glass-input-wrap mt-4">
                            <label className="input-label">
                                <FileText className="size-4 text-accent" />
                                About
                            </label>
                            <textarea
                                className="form-input premium-input description-input"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Tell the world about yourself..."
                                rows="3"
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary premium-submit w-full mt-8"
                            disabled={isUpdatingProfile || (!imageFile && description === (authUser?.description || ''))}
                        >
                            {isUpdatingProfile ? "Saving Changes..." : "Save Changes"}
                        </button>
                    </form>

                    <div className="account-details mt-10 p-6 rounded-2xl glass-panel">
                        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                            <ShieldCheck className="text-accent" /> Account Status
                        </h2>
                        <div className="detail-row">
                            <span className="flex items-center gap-2"><Calendar className="size-4" /> Member Since</span>
                            <span className="font-medium">{authUser?.createdAt?.split("T")[0] || "Unknown"}</span>
                        </div>
                        <div className="detail-row">
                            <span>Status</span>
                            <div className="status-badge"><span className="dot"></span> Active</div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
