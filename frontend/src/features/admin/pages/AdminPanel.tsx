import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '@/common/api/apiClient';
import { useNotification } from '@/common/context/NotificationContext';
import '@/common/styles/PageStyles.css';

interface User {
    id: string;
    email: string;
    roles: string[];
}

const USERS_PER_PAGE = 5;

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

    // Filtry i paginacja
    const [filterEmail, setFilterEmail] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

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

    // Filtrowanie użytkowników
    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const matchesEmail = user.email.toLowerCase().includes(filterEmail.toLowerCase());
            const matchesRole = filterRole === '' || user.roles.includes(filterRole) || (filterRole === 'Brak' && user.roles.length === 0);
            return matchesEmail && matchesRole;
        });
    }, [users, filterEmail, filterRole]);

    // Paginacja
    const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);
    const paginatedUsers = useMemo(() => {
        const startIndex = (currentPage - 1) * USERS_PER_PAGE;
        return filteredUsers.slice(startIndex, startIndex + USERS_PER_PAGE);
    }, [filteredUsers, currentPage]);

    // Reset strony przy zmianie filtrów
    useEffect(() => {
        setCurrentPage(1);
    }, [filterEmail, filterRole]);

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

    const buttonStyle = {
        padding: '0.6rem 1.2rem',
        borderRadius: '6px',
        fontSize: '0.95rem',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        textDecoration: 'none'
    };

    const actionButtonStyle = {
        padding: '0.5rem 0.75rem',
        border: '2px solid transparent',
        borderRadius: '6px',
        color: '#fff',
        cursor: 'pointer',
        fontSize: '0.85rem',
        transition: 'all 0.2s ease'
    };

    return (
        <div className="page-container">
            {/* Przycisk cofania NAD nagłówkiem */}
            <div style={{ marginBottom: '1rem' }}>
                <button 
                    className="btn btn-secondary" 
                    onClick={() => navigate('/')}
                    style={{ ...buttonStyle }}
                >
                    ← Panel główny
                </button>
            </div>

            <header className="page-header">
                <h1 style={{ margin: 0 }}>⚙️ Panel Administracyjny</h1>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <Link to="/admin/ustawienia-firmy" className="btn btn-secondary" style={buttonStyle}>
                        🏢 Dane firmy
                    </Link>
                    <Link to="/admin/raporty" className="btn btn-secondary" style={{...buttonStyle, backgroundColor: '#667eea'}}>
                        📊 Raporty
                    </Link>
                    <button className="btn btn-primary" onClick={handleAddNew} style={buttonStyle}>
                        ➕ Dodaj użytkownika
                    </button>
                </div>
            </header>

            {/* Sekcja użytkowników */}
            <div style={{
                backgroundColor: '#2d3748',
                borderRadius: '12px',
                padding: '1.5rem',
                marginTop: '1rem'
            }}>
                <h2 style={{ 
                    color: '#e2e8f0', 
                    margin: '0 0 1.5rem 0',
                    fontSize: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    👥 Zarządzanie użytkownikami
                    <span style={{ 
                        fontSize: '0.85rem', 
                        color: '#a0aec0',
                        fontWeight: 'normal'
                    }}>
                        ({filteredUsers.length} {filteredUsers.length === 1 ? 'użytkownik' : 'użytkowników'})
                    </span>
                </h2>

                {/* Filtry */}
                <div style={{
                    display: 'flex',
                    gap: '1rem',
                    marginBottom: '1.5rem',
                    alignItems: 'center'
                }}>
                    <input
                        type="text"
                        placeholder="🔍 Szukaj po emailu..."
                        value={filterEmail}
                        onChange={(e) => setFilterEmail(e.target.value)}
                        style={{
                            flex: '1',
                            minWidth: '200px',
                            padding: '0.75rem 1rem',
                            backgroundColor: '#1a202c',
                            border: '1px solid #4a5568',
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: '0.95rem',
                            height: '44px',
                            boxSizing: 'border-box'
                        }}
                    />
                    <select
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value)}
                        style={{
                            width: '180px',
                            padding: '0.75rem 1rem',
                            backgroundColor: '#1a202c',
                            border: '1px solid #4a5568',
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: '0.95rem',
                            height: '44px',
                            boxSizing: 'border-box'
                        }}
                    >
                        <option value="">Wszystkie role</option>
                        {roles.map(r => <option key={r} value={r}>{r}</option>)}
                        <option value="Brak">Brak roli</option>
                    </select>
                    {(filterEmail || filterRole) && (
                        <button
                            onClick={() => { setFilterEmail(''); setFilterRole(''); }}
                            style={{
                                padding: '0.75rem 1rem',
                                backgroundColor: '#4a5568',
                                border: 'none',
                                borderRadius: '8px',
                                color: '#fff',
                                cursor: 'pointer',
                                fontSize: '0.95rem',
                                height: '44px',
                                boxSizing: 'border-box',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            ✕ Wyczyść
                        </button>
                    )}
                </div>

                {/* Lista użytkowników */}
                {paginatedUsers.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '3rem',
                        color: '#a0aec0'
                    }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
                        <p>Nie znaleziono użytkowników spełniających kryteria</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {paginatedUsers.map(user => (
                            <div
                                key={user.id}
                                style={{
                                    backgroundColor: '#1a202c',
                                    borderRadius: '10px',
                                    padding: '1rem 1.25rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    border: '1px solid #4a5568',
                                    transition: 'border-color 0.2s',
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#667eea'}
                                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#4a5568'}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        backgroundColor: '#667eea',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#fff',
                                        fontWeight: 'bold',
                                        fontSize: '1.1rem'
                                    }}>
                                        {user.email.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div style={{ color: '#fff', fontWeight: 500, fontSize: '1rem' }}>
                                            {user.email}
                                        </div>
                                        <div style={{ 
                                            display: 'flex', 
                                            gap: '0.5rem', 
                                            marginTop: '0.25rem' 
                                        }}>
                                            {user.roles.length > 0 ? (
                                                user.roles.map(role => (
                                                    <span
                                                        key={role}
                                                        style={{
                                                            padding: '2px 8px',
                                                            backgroundColor: role === 'Admin' ? '#48bb78' : '#4299e1',
                                                            color: '#fff',
                                                            borderRadius: '4px',
                                                            fontSize: '0.75rem',
                                                            fontWeight: 500
                                                        }}
                                                    >
                                                        {role}
                                                    </span>
                                                ))
                                            ) : (
                                                <span style={{
                                                    padding: '2px 8px',
                                                    backgroundColor: '#718096',
                                                    color: '#fff',
                                                    borderRadius: '4px',
                                                    fontSize: '0.75rem'
                                                }}>
                                                    Brak roli
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => handleEdit(user)}
                                        style={{
                                            ...actionButtonStyle,
                                            backgroundColor: '#4a5568',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.borderColor = '#a0aec0';
                                            e.currentTarget.style.transform = 'scale(1.05)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.borderColor = 'transparent';
                                            e.currentTarget.style.transform = 'scale(1)';
                                        }}
                                        title="Edytuj"
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        onClick={() => handleResetPassword(user.id)}
                                        style={{
                                            ...actionButtonStyle,
                                            backgroundColor: '#ed8936',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.borderColor = '#fbd38d';
                                            e.currentTarget.style.transform = 'scale(1.05)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.borderColor = 'transparent';
                                            e.currentTarget.style.transform = 'scale(1)';
                                        }}
                                        title="Reset hasła"
                                    >
                                        🔑
                                    </button>
                                    <button
                                        onClick={() => handleDelete(user.id)}
                                        style={{
                                            ...actionButtonStyle,
                                            backgroundColor: '#e53e3e',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.borderColor = '#fc8181';
                                            e.currentTarget.style.transform = 'scale(1.05)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.borderColor = 'transparent';
                                            e.currentTarget.style.transform = 'scale(1)';
                                        }}
                                        title="Usuń"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Paginacja */}
                {totalPages > 1 && (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginTop: '1.5rem',
                        paddingTop: '1rem',
                        borderTop: '1px solid #4a5568'
                    }}>
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: currentPage === 1 ? '#2d3748' : '#4a5568',
                                border: 'none',
                                borderRadius: '6px',
                                color: currentPage === 1 ? '#718096' : '#fff',
                                cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                            }}
                        >
                            ←
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                style={{
                                    padding: '0.5rem 0.75rem',
                                    backgroundColor: currentPage === page ? '#667eea' : '#4a5568',
                                    border: 'none',
                                    borderRadius: '6px',
                                    color: '#fff',
                                    cursor: 'pointer',
                                    fontWeight: currentPage === page ? 'bold' : 'normal'
                                }}
                            >
                                {page}
                            </button>
                        ))}
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: currentPage === totalPages ? '#2d3748' : '#4a5568',
                                border: 'none',
                                borderRadius: '6px',
                                color: currentPage === totalPages ? '#718096' : '#fff',
                                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                            }}
                        >
                            →
                        </button>
                    </div>
                )}
            </div>

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
        </div>
    );
};

export default AdminPanel;
