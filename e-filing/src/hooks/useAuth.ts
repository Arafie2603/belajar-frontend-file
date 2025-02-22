import { useState, useCallback } from 'react';
import axios from 'axios';

interface AuthState {
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}

export const useAuth = () => {
    const [auth, setAuth] = useState<AuthState>(() => {
        const token = localStorage.getItem('token');
        return {
            token: token || null,
            isAuthenticated: !!token,
            isLoading: false
        };
    });

    const login = useCallback(async (token: string) => {
        setAuth(prev => ({ ...prev, isLoading: true }));
        try {
            localStorage.setItem('token', token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setAuth({
                token,
                isAuthenticated: true,
                isLoading: false
            });
        } catch (error) {
            setAuth(prev => ({ ...prev, isLoading: false }));
            throw error;
        }
    }, []);

    const logout = useCallback(async () => {
        setAuth(prev => ({ ...prev, isLoading: true }));
        try {
            const BASE_URL = import.meta.env.VITE_BASE_URL || "https://belajar-backend-d3iolm3c5-arafie2603s-projects.vercel.app/";
            const token = auth.token;

            if (token) {
                await axios.post(`${BASE_URL}api/users/logout`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('token');
            delete axios.defaults.headers.common['Authorization'];
            setAuth({
                token: null,
                isAuthenticated: false,
                isLoading: false
            });
        }
    }, [auth.token]);

    return {
        token: auth.token,
        isAuthenticated: auth.isAuthenticated,
        isLoading: auth.isLoading,
        login,
        logout
    };
};