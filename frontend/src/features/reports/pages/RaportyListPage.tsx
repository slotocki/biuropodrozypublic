import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/common/api/apiClient';
import { useNotification } from '@/common/context/NotificationContext';
import '@/common/styles/PageStyles.css';

interface MiesiacOption {
    rok: number;
    miesiac: number;
    etykieta: string;
}

const ROWS_OPTIONS = [10, 25, 50, 100];

const RaportyListPage = () => {
    const navigate = useNavigate();
    const { showToast } = useNotification();
    const [loading, setLoading] = useState(true);
    const [miesiace, setMiesiace] = useState<MiesiacOption[]>([]);
    
    // Paginacja
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    const fetchMiesiace = useCallback(async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/api/raporty/dostepne-miesiace');
            setMiesiace(response.data);
        } catch (error) {
            console.error('Błąd podczas pobierania miesięcy:', error);
            showToast('Nie udało się pobrać dostępnych okresów', 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchMiesiace();
    }, [fetchMiesiace]);

    // Paginacja
    const totalPages = Math.ceil(miesiace.length / rowsPerPage);
    const paginatedMiesiace = useMemo(() => {
        const startIndex = (currentPage - 1) * rowsPerPage;
        return miesiace.slice(startIndex, startIndex + rowsPerPage);
    }, [miesiace, currentPage, rowsPerPage]);

    const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setRowsPerPage(Number(e.target.value));
        setCurrentPage(1);
    };

    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > totalPages) return;
        setCurrentPage(newPage);
    };

    const handleOpenReport = (rok: number, miesiac: number) => {
        navigate(`/admin/raporty/${rok}/${miesiac}`);
    };

    // Bieżący miesiąc
    const teraz = new Date();
    const biezacyRok = teraz.getFullYear();
    const biezacyMiesiac = teraz.getMonth() + 1;

    if (loading) {
        return (
            <div className="page-container">
                <p className="loading-text">Ładowanie dostępnych okresów...</p>
            </div>
        );
    }

    return (
        <div className="page-container">
            {/* Przycisk cofania NAD nagłówkiem */}
            <div style={{ marginBottom: '1rem' }}>
                <button 
                    className="btn btn-secondary" 
                    onClick={() => navigate('/admin')}
                    style={{ 
                        padding: '0.6rem 1.2rem',
                        borderRadius: '6px',
                        fontSize: '0.95rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    ← Panel administracyjny
                </button>
            </div>

            <header className="page-header">
                <h1 style={{ margin: 0 }}>📊 Raporty Miesięczne</h1>
                <button
                    className="btn btn-primary"
                    onClick={() => handleOpenReport(biezacyRok, biezacyMiesiac)}
                >
                    📅 Raport bieżącego miesiąca
                </button>
            </header>

            {/* Lista raportów - styl jak w FakturyListPage */}
            {miesiace.length === 0 ? (
                <div style={{
                    marginTop: '1rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
                    borderRadius: '8px',
                    backgroundColor: '#1e2533',
                    padding: '3rem',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📭</div>
                    <h3 style={{ color: '#a0aec0', margin: 0 }}>Brak danych</h3>
                    <p style={{ color: '#718096', marginTop: '0.5rem' }}>
                        Nie znaleziono żadnych faktur w systemie.
                    </p>
                </div>
            ) : (
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
                                }}>Rok</th>
                                <th style={{ 
                                    padding: '0.75rem',
                                    borderBottom: '1px solid #4a5568',
                                    color: '#e2e8f0',
                                    textAlign: 'left',
                                    whiteSpace: 'nowrap'
                                }}>Miesiąc</th>
                                <th style={{ 
                                    padding: '0.75rem',
                                    borderBottom: '1px solid #4a5568',
                                    color: '#e2e8f0',
                                    textAlign: 'center',
                                    width: '150px'
                                }}>Status</th>
                                <th style={{ 
                                    padding: '0.75rem',
                                    borderBottom: '1px solid #4a5568',
                                    color: '#e2e8f0',
                                    textAlign: 'center',
                                    width: '120px'
                                }}>Akcja</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedMiesiace.map((m, index) => {
                                const isCurrent = m.rok === biezacyRok && m.miesiac === biezacyMiesiac;
                                const rowBg = isCurrent 
                                    ? 'rgba(66, 153, 225, 0.15)' 
                                    : index % 2 === 0 
                                        ? '#1e2533' 
                                        : '#252d3d';
                                return (
                                    <tr
                                        key={`${m.rok}-${m.miesiac}`}
                                        style={{
                                            backgroundColor: rowBg,
                                            cursor: 'pointer',
                                            transition: 'background-color 0.15s ease'
                                        }}
                                        onClick={() => handleOpenReport(m.rok, m.miesiac)}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3a4556'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = rowBg}
                                    >
                                        <td style={{ padding: '0.6rem 0.75rem', color: '#a0aec0' }}>{m.rok}</td>
                                        <td style={{ padding: '0.6rem 0.75rem', color: '#e2e8f0', fontWeight: 'bold' }}>
                                            {m.etykieta.split(' ')[0]}
                                        </td>
                                        <td style={{ padding: '0.6rem 0.75rem', textAlign: 'center' }}>
                                            {isCurrent ? (
                                                <span style={{
                                                    padding: '2px 10px',
                                                    backgroundColor: '#4299e1',
                                                    borderRadius: '4px',
                                                    fontSize: '0.8rem',
                                                    color: '#fff'
                                                }}>
                                                    Bieżący
                                                </span>
                                            ) : (
                                                <span style={{
                                                    padding: '2px 10px',
                                                    backgroundColor: '#48bb78',
                                                    borderRadius: '4px',
                                                    fontSize: '0.8rem',
                                                    color: '#fff'
                                                }}>
                                                    Zamknięty
                                                </span>
                                            )}
                                        </td>
                                        <td style={{ padding: '0.4rem', textAlign: 'center' }}>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleOpenReport(m.rok, m.miesiac); }}
                                                style={{
                                                    padding: '0.4rem 0.8rem',
                                                    borderRadius: '6px',
                                                    border: '2px solid transparent',
                                                    backgroundColor: '#667eea',
                                                    color: '#fff',
                                                    cursor: 'pointer',
                                                    fontSize: '0.85rem',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={(e) => { 
                                                    e.currentTarget.style.borderColor = '#a3bffa'; 
                                                    e.currentTarget.style.transform = 'scale(1.05)'; 
                                                }}
                                                onMouseLeave={(e) => { 
                                                    e.currentTarget.style.borderColor = 'transparent'; 
                                                    e.currentTarget.style.transform = 'scale(1)'; 
                                                }}
                                            >
                                                📊 Otwórz
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Paginacja na dole - identyczna jak w FakturyListPage */}
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
                    <span>z {miesiace.length} okresów</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                        onClick={() => handlePageChange(1)}
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
                        onClick={() => handlePageChange(currentPage - 1)}
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
                        onClick={() => handlePageChange(currentPage + 1)}
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
                        onClick={() => handlePageChange(totalPages)}
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
        </div>
    );
};

export default RaportyListPage;

