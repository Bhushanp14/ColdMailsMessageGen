import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const USAGE_API = 'http://localhost:8000/api/usage/';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('access_token'));
    const [usage, setUsage] = useState({
        emailCount: 0, messageCount: 0,
        emailLimit: 10, messageLimit: 10,
    });
    const [loading, setLoading] = useState(true);

    const fetchUsage = async (authToken = token) => {
        try {
            const config = authToken ? { headers: { Authorization: `Bearer ${authToken}` } } : {};
            const response = await axios.get(USAGE_API, config);
            const d = response.data;
            setUsage({
                emailCount: d.email_count,
                messageCount: d.message_count,
                emailLimit: d.email_limit,
                messageLimit: d.message_limit,
            });
        } catch (error) {
            console.error('Failed to fetch usage:', error);
        }
    };

    useEffect(() => {
        fetchUsage();
    }, [token]);

    useEffect(() => {
        if (token) {
            try {
                const decoded = jwtDecode(token);
                if (decoded.exp * 1000 < Date.now()) {
                    logout();
                } else {
                    setUser(decoded);
                }
            } catch (e) {
                logout();
            }
        }
        setLoading(false);
    }, [token]);

    const login = async (accessToken) => {
        localStorage.setItem('access_token', accessToken);
        setToken(accessToken);
        const decoded = jwtDecode(accessToken);
        setUser(decoded);
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        setToken(null);
        setUser(null);
        setUsage({ emailCount: 0, messageCount: 0, emailLimit: 10, messageLimit: 10 });
    };

    const updateUsage = (emailCount, messageCount) => {
        setUsage(prev => ({
            ...prev,
            ...(emailCount !== undefined ? { emailCount } : {}),
            ...(messageCount !== undefined ? { messageCount } : {}),
        }));
    };

    // The max rows the user should see by default (based on their best remaining credits)
    const getRowLimit = () => {
        return Math.max(usage.emailLimit, usage.messageLimit);
    };

    return (
        <AuthContext.Provider value={{
            user, token, usage, loading,
            login, logout, updateUsage,
            refreshUsage: fetchUsage, getRowLimit,
        }}>
            {children}
        </AuthContext.Provider>
    );
};
