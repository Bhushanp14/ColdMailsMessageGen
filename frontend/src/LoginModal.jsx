import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';

const BASE = 'http://localhost:8000/api';

const LoginModal = ({ isOpen, onClose }) => {
    const [isSignup, setIsSignup] = useState(false);
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [firstName, setFirstName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const resetForm = () => {
        setEmail(''); setPassword(''); setFirstName(''); setConfirmPassword('');
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            const response = await axios.post(`${BASE}/auth/google/`, {
                access_token: credentialResponse.credential,
            });
            login(response.data.access_token);
            toast.success(`Welcome${response.data.user?.first_name ? ', ' + response.data.user.first_name : ''}! Logged in with Google.`);
            onClose();
        } catch (error) {
            console.error('Google login failed:', error);
            toast.error('Google login failed. Please try again.');
        }
    };

    const handleEmailAuth = async (e) => {
        e.preventDefault();
        if (isSignup && password !== confirmPassword) {
            toast.error('Passwords do not match.');
            return;
        }
        setLoading(true);
        try {
            const endpoint = isSignup ? `${BASE}/auth/register/` : `${BASE}/auth/login/`;
            const payload = isSignup
                ? { email, password, first_name: firstName }
                : { email, password };

            const response = await axios.post(endpoint, payload);
            login(response.data.access_token);
            toast.success(isSignup ? 'Account created! Welcome aboard 🎉' : 'Welcome back!');
            resetForm();
            onClose();
        } catch (error) {
            const msg = error.response?.data?.error || 'Something went wrong.';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content auth-modal" onClick={(e) => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}>&times;</button>
                <h2>{isSignup ? 'Create Account' : 'Welcome Back'}</h2>
                <p className="auth-subtitle">
                    {isSignup
                        ? 'Sign up to get 15 extra free messages!'
                        : 'Log in to access your extra credits.'}
                </p>

                <div className="google-btn-container">
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => toast.error('Google login failed')}
                        theme="filled_blue"
                        shape="pill"
                        text={isSignup ? 'signup_with' : 'signin_with'}
                    />
                </div>

                <div className="divider"><span>OR</span></div>

                <form onSubmit={handleEmailAuth} className="auth-form">
                    {isSignup && (
                        <input
                            type="text"
                            placeholder="First Name (optional)"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                        />
                    )}
                    <input
                        type="email"
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password (min 8 chars)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    {isSignup && (
                        <input
                            type="password"
                            placeholder="Confirm Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    )}
                    <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                        {loading ? 'Please wait...' : isSignup ? 'Create Account' : 'Log In'}
                    </button>
                </form>

                <p className="auth-toggle">
                    {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
                    <span onClick={() => { setIsSignup(!isSignup); resetForm(); }}>
                        {isSignup ? 'Log In' : 'Sign Up Free'}
                    </span>
                </p>
            </div>
        </div>
    );
};

export default LoginModal;
