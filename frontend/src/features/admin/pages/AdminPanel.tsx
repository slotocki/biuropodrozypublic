import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '@/common/api/apiClient';
import { useNotification } from '@/common/context/NotificationContext';
import '@/common/styles/PageStyles.css';
interface User {
    id: string;
    email: string;
    roles: string[];
}

const AdminPanel = () => {
    const navigate = useNavigate();
    const { showToast, showConfirm } = useNotification();
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<string[]>([]);
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [isPasswordResetVisible, setIsPasswordResetVisible] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [resetPasswordUserId, setResetPasswordUserId] = useState<string | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        role: ''
    });

    const fetchUsers = async () => {
        try {
            const response = await apiClient.get('/api/admin/users');
            setUsers(response.data);
        } catch (error: any) {
            if (error.response?.status === 403) {
                showToast('Brak uprawnień administratora', 'error');
            } else {
                showToast('Błąd pobierania użytkowników', 'error');
            }
        }
    };

    const fetchRoles = async () => {
        try {
            const response = await apiClient.get('/api/admin/roles');
            setRoles(response.data);
        } catch (error) {
            console.error('Błąd pobierania ról:', error);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchRoles();
    }, []);

    const handleAddNew = () => {
        setEditingUser(null);
        setFormData({ email: '', password: '', role: '' });
        setIsFormVisible(true);
    };

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setFormData({ email: user.email, password: '', role: user.roles[0] || '' });
        setIsFormVisible(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingUser) {
                await apiClient.put(`/api/admin/users/${editingUser.id}`, {
                    email: formData.email,
                    role: formData.role
                });
                showToast('Użytkownik zaktualizowany', 'success');
            } else {
                await apiClient.post('/api/admin/users', formData);
                showToast('Użytkownik dodany', 'success');
            }
            setIsFormVisible(false);
            fetchUsers();
        } catch (error: any) {
            const errorMsg = error.response?.data?.errors?.[0] || 'Błąd zapisu użytkownika';
            showToast(errorMsg, 'error');
        }
    };

    const handleResetPassword = async (userId: string) => {
        setResetPasswordUserId(userId);
        setNewPassword('');
        setIsPasswordResetVisible(true);
    };

    const handlePasswordResetSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!resetPasswordUserId) return;

        try {
            await apiClient.post(`/api/admin/users/${resetPasswordUserId}/reset-password`, {
                newPassword: newPassword
            });
            showToast('Hasło zostało zresetowane', 'success');
            setIsPasswordResetVisible(false);
            setNewPassword('');
        } catch (error: any) {
            const errorMsg = error.response?.data?.errors?.[0] || 'Błąd resetowania hasła';
            showToast(errorMsg, 'error');
        }
    };

    const handleDelete = async (id: string) => {
        const confirmed = await showConfirm('Potwierdź usunięcie', 'Czy na pewno usunąć użytkownika?');
        if (confirmed) {
            try {
                await apiClient.delete(`/api/admin/users/${id}`);
                showToast('Użytkownik usunięty', 'success');
                fetchUsers();
            } catch (error) {
                showToast('Błąd usuwania użytkownika', 'error');
            }
        }
    };

    return (
        <div className="page-container">
            <header className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button 
                        className="btn btn-secondary" 
                        onClick={() => navigate(-1)}
                        style={{ padding: '0.5rem 1rem' }}
                    >
                        ← Wstecz
                    </button>
                    <h1>👥 Panel Administracyjny</h1>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Link to="/admin/ustawienia-firmy" className="btn btn-secondary">
                        🏢 Dane firmy
                    </Link>
                    <button className="btn btn-primary" onClick={handleAddNew}>
                        ➕ Dodaj użytkownika
                    </button>
                </div>
            </header>

            {/* Modal edycji/dodawania użytkownika */}
            {isFormVisible && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.7)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: '#2d3748',
                        padding: '2rem',
                        borderRadius: '8px',
                        width: '90%',
                        maxWidth: '500px'
                    }}>
                        <form onSubmit={handleSubmit}>
                            <h3>{editingUser ? 'Edytuj użytkownika' : 'Nowy użytkownik'}</h3>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#a0aec0' }}>Email:</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={e => setFormData({...formData, email: e.target.value})}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        background: '#1a202c',
                                        border: '1px solid #4a5568',
                                        borderRadius: '4px',
                                        color: '#edf2f7'
                                    }}
                                />
                            </div>
                            {!editingUser && (
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#a0aec0' }}>Hasło:</label>
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={e => setFormData({...formData, password: e.target.value})}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            background: '#1a202c',
                                            border: '1px solid #4a5568',
                                            borderRadius: '4px',
                                            color: '#edf2f7'
                                        }}
                                    />
                                </div>
                            )}
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#a0aec0' }}>Rola:</label>
                                <select
                                    value={formData.role}
                                    onChange={e => setFormData({...formData, role: e.target.value})}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        background: '#1a202c',
                                        border: '1px solid #4a5568',
                                        borderRadius: '4px',
                                        color: '#edf2f7'
                                    }}
                                >
                                    <option value="">Brak</option>
                                    {roles.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setIsFormVisible(false)}>Anuluj</button>
                                <button type="submit" className="btn btn-primary">Zapisz</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal resetowania hasła */}
            {isPasswordResetVisible && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.7)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: '#2d3748',
                        padding: '2rem',
                        borderRadius: '8px',
                        width: '90%',
                        maxWidth: '400px'
                    }}>
                        <form onSubmit={handlePasswordResetSubmit}>
                            <h3>Resetuj hasło</h3>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#a0aec0' }}>Nowe hasło:</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        background: '#1a202c',
                                        border: '1px solid #4a5568',
                                        borderRadius: '4px',
                                        color: '#edf2f7'
                                    }}
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setIsPasswordResetVisible(false)}>Anuluj</button>
                                <button type="submit" className="btn btn-primary">Resetuj hasło</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <table className="data-table">
                <thead>
                <tr>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Akcje</th>
                </tr>
                </thead>
                <tbody>
                {users.map(user => (
                    <tr key={user.id}>
                        <td>{user.email}</td>
                        <td>{user.roles.join(', ') || 'Brak'}</td>
                        <td>
                            <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(user)} style={{ marginRight: '0.5rem' }}>✏️ Edytuj</button>
                            <button className="btn btn-warning btn-sm" onClick={() => handleResetPassword(user.id)} style={{ marginRight: '0.5rem' }}>🔑 Reset hasła</button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(user.id)}>🗑️ Usuń</button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};

export default AdminPanel;
