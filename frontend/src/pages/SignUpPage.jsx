import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Link, useSearchParams } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, Sparkles } from 'lucide-react';
import './AuthPages.css';

const SignUpPage = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        username: '',
        password: '',
        confirmPassword: '',
        gender: 'male',
    });

    const [searchParams] = useSearchParams();
    const invitedBy = searchParams.get('invite');

    const { signup, isLoggingIn } = useAuthStore();

    const handleSubmit = async (e) => {
        e.preventDefault();
        await signup(formData);
    };

    return (
        <div className="auth-container animate-fade-in">
            <div className="auth-card">
                <div className="auth-header">
                    <h2>Create Account</h2>
                    <p>Get started with your free account</p>
                </div>

                {invitedBy && (
                    <div className="invite-banner p-3 mb-4 rounded-lg flex items-center justify-center gap-2 text-sm font-medium" style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-color)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                        <Sparkles size={16} />
                        You were invited by @{invitedBy}!
                    </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label>Full Name</label>
                        <div className="input-with-icon">
                            <User size={20} className="input-icon" />
                            <input
                                type="text"
                                placeholder="John Doe"
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Username</label>
                        <div className="input-with-icon">
                            <Mail size={20} className="input-icon" />
                            <input
                                type="text"
                                placeholder="johndoe"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <div className="input-with-icon">
                            <Lock size={20} className="input-icon" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                            />
                            <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Confirm Password</label>
                        <div className="input-with-icon">
                            <Lock size={20} className="input-icon" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group gender-group">
                        <label>Gender</label>
                        <div className="radio-group">
                            <label className="radio-label">
                                <input type="radio" value="male" checked={formData.gender === 'male'} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} />
                                <span>Male</span>
                            </label>
                            <label className="radio-label">
                                <input type="radio" value="female" checked={formData.gender === 'female'} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} />
                                <span>Female</span>
                            </label>
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary btn-block" disabled={isLoggingIn}>
                        {isLoggingIn ? 'Creating account...' : 'Sign Up'}
                    </button>

                    <p className="auth-footer">
                        Already have an account? <Link to="/login">Log in here</Link>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default SignUpPage;
