import React, { createContext, useContext, useState, ReactNode } from 'react';
import Toast from '../components/Toast/Toast';
import ConfirmDialog from '../components/ConfirmDialog/ConfirmDialog';

// ✅ Zdefiniuj typ tutaj zamiast importować
type ToastType = 'success' | 'error' | 'warning' | 'info';

interface NotificationContextType {
    showToast: (message: string, type?: ToastType) => void;
    showConfirm: (title: string, message: string) => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
    const [confirm, setConfirm] = useState<{
        title: string;
        message: string;
        resolve: (value: boolean) => void;
    } | null>(null);

    const showToast = (message: string, type: ToastType = 'info') => {
        setToast({ message, type });
    };

    const showConfirm = (title: string, message: string): Promise<boolean> => {
        return new Promise((resolve) => {
            setConfirm({ title, message, resolve });
        });
    };

    const handleConfirm = () => {
        if (confirm) {
            confirm.resolve(true);
            setConfirm(null);
        }
    };

    const handleCancel = () => {
        if (confirm) {
            confirm.resolve(false);
            setConfirm(null);
        }
    };

    return (
        <NotificationContext.Provider value={{ showToast, showConfirm }}>
            {children}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
            {confirm && (
                <ConfirmDialog
                    title={confirm.title}
                    message={confirm.message}
                    onConfirm={handleConfirm}
                    onCancel={handleCancel}
                />
            )}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within NotificationProvider');
    }
    return context;
};
