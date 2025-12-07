import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

interface User {
    userName: string;
}

interface AuthContextType {
    isAuthenticated: boolean;
    user: User | null;
    login: (token: string, userName: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        const userName = localStorage.getItem('userName');

        if (token) {
            if (userName) {
                setIsAuthenticated(true);
                setUser({ userName });
            } else {
                // ⭐ Pobierz z API jeśli brak w localStorage
                fetchUserProfile(token);
            }
        }
    }, []);

    const fetchUserProfile = async (token: string) => {
        try {
            const response = await fetch('http://localhost:5224/api/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setUser({ userName: data.userName });
                localStorage.setItem('userName', data.userName);
                setIsAuthenticated(true);
            } else {
                logout();
            }
        } catch (error) {
            console.error('Błąd pobierania profilu:', error);
            logout();
        }
    };

    const login = (token: string, userName: string) => {
        localStorage.setItem('authToken', token);
        localStorage.setItem('userName', userName);
        setIsAuthenticated(true);
        setUser({ userName });
    };

    const logout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userName');
        setIsAuthenticated(false);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
