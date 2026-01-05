// src/components/common/ConfirmModal.tsx
import React from 'react';
import '@/pages/PageStyles.css';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    type?: 'danger' | 'warning' | 'info';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
                                                              isOpen,
                                                              title,
                                                              message,
                                                              confirmText = 'Potwierdź',
                                                              cancelText = 'Anuluj',
                                                              onConfirm,
                                                              onCancel,
                                                              type = 'warning'
                                                          }) => {
    if (!isOpen) return null;

    const getColor = () => {
        switch (type) {
            case 'danger': return '#fc8181';
            case 'warning': return '#fbd38d';
            case 'info': return '#90cdf4';
            default: return '#fbd38d';
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <div style={{
                backgroundColor: '#2d3748',
                borderRadius: '8px',
                padding: '2rem',
                maxWidth: '500px',
                width: '90%',
                border: `2px solid ${getColor()}`
            }}>
                <h2 style={{ color: '#f7fafc', marginBottom: '1rem', fontSize: '1.5rem' }}>
                    {title}
                </h2>

                <p style={{ color: '#cbd5e0', marginBottom: '2rem', lineHeight: '1.6' }}>
                    {message}
                </p>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                    <button
                        onClick={onCancel}
                        className="btn btn-secondary"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className="btn btn-danger"
                        style={{
                            backgroundColor: type === 'danger' ? '#fc8181' : type === 'warning' ? '#ed8936' : '#4299e1'
                        }}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
