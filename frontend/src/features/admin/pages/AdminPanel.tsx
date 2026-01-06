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

const ROWS_OPTIONS = [10, 25, 50, 100];

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
    const [rowsPerPage, setRowsPerPage] = useState(10);

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
    const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);
    const paginatedUsers = useMemo(() => {
        const startIndex = (currentPage - 1) * rowsPerPage;
        return filteredUsers.slice(startIndex, startIndex + rowsPerPage);
    }, [filteredUsers, currentPage, rowsPerPage]);

    // Reset strony przy zmianie filtrów lub liczby wierszy
    useEffect(() => {
        setCurrentPage(1);
    }, [filterEmail, filterRole, rowsPerPage]);

    const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setRowsPerPage(Number(e.target.value));
    };

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

            {/* Tabela użytkowników - styl jak w FakturyListPage */}
            <div style={{
                marginTop: '1rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
                borderRadius: '8px',
                overflow: 'hidden'
            }}>
                <table style={{ 
                    width: '100%', 
                    borderCollapse: 'collapse',
                    backgroundColor: '#1e2533'
                }}>
                    <thead>
                        <tr style={{ backgroundColor: '#2d3748' }}>
                            <th style={{ 
                                padding: '0.75rem',
                                borderBottom: '1px solid #4a5568',
                                color: '#e2e8f0',
                                textAlign: 'left',
                                whiteSpace: 'nowrap'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <span>Email</span>
                                    <input
                                        type="text"
                                        placeholder="🔍 Filtruj..."
                                        value={filterEmail}
                                        onChange={(e) => setFilterEmail(e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                        style={{
                                            padding: '0.25rem 0.5rem',
                                            borderRadius: '4px',
                                            border: '1px solid #4a5568',
                                            backgroundColor: '#1a202c',
                                            color: '#fff',
                                            fontSize: '0.75rem',
                                            width: '150px'
                                        }}
                                    />
                                    {filterEmail && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setFilterEmail(''); }}
                                            style={{
                                                padding: '0.2rem 0.4rem',
                                                borderRadius: '4px',
                                                border: 'none',
                                                backgroundColor: '#4a5568',
                                                color: '#fff',
                                                cursor: 'pointer',
                                                fontSize: '0.7rem'
                                            }}
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            </th>
                            <th style={{ 
                                padding: '0.75rem',
                                borderBottom: '1px solid #4a5568',
                                color: '#e2e8f0',
                                textAlign: 'left',
                                whiteSpace: 'nowrap'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <span>Rola</span>
                                    <select
                                        value={filterRole}
                                        onChange={(e) => setFilterRole(e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                        style={{
                                            padding: '0.25rem 0.5rem',
                                            borderRadius: '4px',
                                            border: '1px solid #4a5568',
                                            backgroundColor: '#1a202c',
                                            color: '#fff',
                                            fontSize: '0.75rem',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <option value="">Wszystkie</option>
                                        {roles.map(r => <option key={r} value={r}>{r}</option>)}
                                        <option value="Brak">Brak roli</option>
                                    </select>
                                </div>
                            </th>
                            <th style={{ 
                                padding: '0.75rem',
                                borderBottom: '1px solid #4a5568',
                                color: '#e2e8f0',
                                textAlign: 'center',
                                width: '120px'
                            }}>Akcje</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedUsers.length === 0 ? (
                            <tr>
                                <td colSpan={3} style={{ 
                                    padding: '2rem', 
                                    textAlign: 'center', 
                                    color: '#a0aec0' 
                                }}>
                                    {filterEmail || filterRole ? 'Brak użytkowników dla podanych kryteriów.' : 'Brak użytkowników.'}
                                </td>
                            </tr>
                        ) : (
                            paginatedUsers.map((user, index) => {
                                const rowBg = index % 2 === 0 ? '#1e2533' : '#252d3d';
                                return (
                                    <tr
                                        key={user.id}
                                        style={{
                                            backgroundColor: rowBg,
                                            transition: 'background-color 0.15s ease'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3a4556'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = rowBg}
                                    >
                                        <td style={{ padding: '0.75rem', color: '#e2e8f0' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{
                                                    width: '32px',
                                                    height: '32px',
                                                    borderRadius: '50%',
                                                    backgroundColor: '#667eea',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: '#fff',
                                                    fontWeight: 'bold',
                                                    fontSize: '0.9rem'
                                                }}>
                                                    {user.email.charAt(0).toUpperCase()}
                                                </div>
                                                <span>{user.email}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '0.75rem' }}>
                                            {user.roles.length > 0 ? (
                                                user.roles.map(role => (
                                                    <span
                                                        key={role}
                                                        style={{
                                                            padding: '2px 8px',
                                                            backgroundColor: role === 'Admin' ? '#48bb78' : '#4299e1',
                                                            color: '#fff',
                                                            borderRadius: '4px',
                                                            fontSize: '0.8rem',
                                                            marginRight: '0.25rem'
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
                                                    fontSize: '0.8rem'
                                                }}>
                                                    Brak roli
                                                </span>
                                            )}
                                        </td>
                                        <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.35rem' }}>
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
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Paginacja na dole */}
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginTop: '1rem',
                padding: '0.75rem 0',
                color: '#a0aec0',
                fontSize: '0.9rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>Pokaż</span>
                    <select
                        value={rowsPerPage}
                        onChange={handleRowsPerPageChange}
                        style={{
                            padding: '0.4rem 1.8rem 0.4rem 0.6rem',
                            borderRadius: '4px',
                            border: '1px solid #4a5568',
                            backgroundColor: '#2d3748',
                            color: '#fff',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            appearance: 'none',
                            WebkitAppearance: 'none',
                            MozAppearance: 'none',
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23a0aec0' d='M6 8L2 4h8z'/%3E%3C/svg%3E")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 0.5rem center',
                            backgroundSize: '12px'
                        }}
                    >
                        {ROWS_OPTIONS.map(option => (
                            <option key={option} value={option}>{option}</option>
                        ))}
                    </select>
                    <span>z {filteredUsers.length} użytkowników</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        style={{
                            padding: '0.4rem 0.6rem',
                            borderRadius: '4px',
                            border: 'none',
                            backgroundColor: currentPage === 1 ? '#374151' : '#4a5568',
                            color: currentPage === 1 ? '#6b7280' : '#fff',
                            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                            fontSize: '0.85rem'
                        }}
                    >
                        ««
                    </button>
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        style={{
                            padding: '0.4rem 0.6rem',
                            borderRadius: '4px',
                            border: 'none',
                            backgroundColor: currentPage === 1 ? '#374151' : '#4a5568',
                            color: currentPage === 1 ? '#6b7280' : '#fff',
                            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                            fontSize: '0.85rem'
                        }}
                    >
                        «
                    </button>
                    <span style={{ padding: '0 0.5rem', color: '#e2e8f0' }}>
                        Strona {currentPage} z {totalPages || 1}
                    </span>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages || totalPages === 0}
                        style={{
                            padding: '0.4rem 0.6rem',
                            borderRadius: '4px',
                            border: 'none',
                            backgroundColor: currentPage === totalPages || totalPages === 0 ? '#374151' : '#4a5568',
                            color: currentPage === totalPages || totalPages === 0 ? '#6b7280' : '#fff',
                            cursor: currentPage === totalPages || totalPages === 0 ? 'not-allowed' : 'pointer',
                            fontSize: '0.85rem'
                        }}
                    >
                        »
                    </button>
                    <button
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages || totalPages === 0}
                        style={{
                            padding: '0.4rem 0.6rem',
                            borderRadius: '4px',
                            border: 'none',
                            backgroundColor: currentPage === totalPages || totalPages === 0 ? '#374151' : '#4a5568',
                            color: currentPage === totalPages || totalPages === 0 ? '#6b7280' : '#fff',
                            cursor: currentPage === totalPages || totalPages === 0 ? 'not-allowed' : 'pointer',
                            fontSize: '0.85rem'
                        }}
                    >
                        »»
                    </button>
                </div>
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
