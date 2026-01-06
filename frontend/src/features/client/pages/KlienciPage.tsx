import React, { useState, useEffect, useCallback, useMemo } from 'react';
import apiClient from '@/common/api/apiClient';
import { useNotification } from '@/common/context/NotificationContext';
import '@/common/styles/PageStyles.css';
import KlientForm from '@/features/client/components/form/KlientForm';
import ImportKlientow from '@/features/client/pages/ImportKlientow';
import type { Klient } from '@/common/types';

type SortField = 'imie' | 'nazwisko' | 'iloscWystapien' | 'dataUrodzenia';
type SortDirection = 'asc' | 'desc' | null;

const ROWS_OPTIONS = [10, 25, 50, 100];

const KlienciPage = () => {
    const { showToast, showConfirm } = useNotification();
    const [klienci, setKlienci] = useState<Klient[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [isImportVisible, setIsImportVisible] = useState(false);
    const [selectedKlient, setSelectedKlient] = useState<Klient | null>(null);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    const [sortField, setSortField] = useState<SortField | null>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>(null);

    // Paginacja
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    const fetchKlienci = useCallback(async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/api/klienci');
            setKlienci(response.data);
        } catch (err) {
            setError('Nie udało się pobrać listy klientów.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchKlienci();
    }, [fetchKlienci]);

    const handleAddNew = () => {
        setSelectedKlient(null);
        setIsFormVisible(true);
    };

    const handleImport = () => {
        setIsImportVisible(true);
    };

    const handleEdit = () => {
        if (selectedIds.length !== 1) {
            showToast('Zaznacz dokładnie jednego klienta do edycji.', 'warning');
            return;
        }
        const klient = klienci.find(k => k.idKlient === selectedIds[0]);
        if (klient) {
            setSelectedKlient(klient);
            setIsFormVisible(true);
        }
    };

    const handleSave = () => {
        setIsFormVisible(false);
        setSelectedIds([]);
        fetchKlienci();
        showToast('Klient został zapisany pomyślnie.', 'success');
    };

    const handleImportClose = () => {
        setIsImportVisible(false);
        fetchKlienci();
    };

    const handleDelete = async () => {
        if (selectedIds.length === 0) {
            showToast('Zaznacz klientów do usunięcia.', 'warning');
            return;
        }

        const confirmed = await showConfirm(
            'Potwierdzenie usunięcia',
            `Czy na pewno chcesz usunąć ${selectedIds.length} klient(ów)?`
        );

        if (confirmed) {
            try {
                const deletePromises = selectedIds.map(async (id) => {
                    try {
                        await apiClient.delete(`/api/klienci/${id}`);
                        return { id, success: true };
                    } catch (error: any) {
                        return {
                            id,
                            success: false,
                            message: error.response?.data?.message || 'Nieznany błąd'
                        };
                    }
                });

                const results = await Promise.all(deletePromises);
                const failed = results.filter(r => !r.success);
                const succeeded = results.filter(r => r.success);

                if (succeeded.length > 0) {
                    showToast(`Usunięto ${succeeded.length} klient(ów)`, 'success');
                }

                if (failed.length > 0) {
                    failed.forEach(f => showToast(f.message, 'error'));
                }

                setSelectedIds([]);
                fetchKlienci();
            } catch (err) {
                showToast('Wystąpił nieoczekiwany błąd podczas usuwania.', 'error');
                console.error(err);
            }
        }
    };

    const handleRowClick = (id: number) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            if (sortDirection === 'asc') {
                setSortDirection('desc');
            } else if (sortDirection === 'desc') {
                setSortField(null);
                setSortDirection(null);
            }
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const filteredAndSortedKlienci = useMemo(() => {
        let result = klienci.filter(klient =>
            klient.imie.toLowerCase().includes(searchTerm.toLowerCase()) ||
            klient.nazwisko.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (sortField && sortDirection) {
            result.sort((a, b) => {
                const aVal = a[sortField] || '';
                const bVal = b[sortField] || '';

                if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [klienci, searchTerm, sortField, sortDirection]);

    // Paginacja
    const paginatedKlienci = useMemo(() => {
        const start = (currentPage - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        return filteredAndSortedKlienci.slice(start, end);
    }, [filteredAndSortedKlienci, currentPage, rowsPerPage]);

    const totalPages = Math.ceil(filteredAndSortedKlienci.length / rowsPerPage);

    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > totalPages) return;
        setCurrentPage(newPage);
    };

    const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setRowsPerPage(Number(e.target.value));
        setCurrentPage(1);
    };

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        setCurrentPage(1);
    };

    if (loading) return <p className="loading-text">Ładowanie klientów...</p>;
    if (error) return <p className="error-text">{error}</p>;

    return (
        <div className="page-container">
            {isFormVisible && (
                <KlientForm
                    klientToEdit={selectedKlient}
                    onSave={handleSave}
                    onCancel={() => setIsFormVisible(false)}
                />
            )}

            {isImportVisible && (
                <ImportKlientow onClose={handleImportClose} />
            )}

            <header className="page-header">
                <h1>Klienci</h1>
                <input
                    type="text"
                    placeholder="Szukaj po imieniu lub nazwisku..."
                    className="search-input"
                    value={searchTerm}
                    onChange={e => handleSearchChange(e.target.value)}
                />
            </header>

            <div className="action-buttons">
                <button className="btn btn-secondary" onClick={handleEdit} disabled={selectedIds.length !== 1}>
                    ✏️ Edytuj
                </button>
                <button className="btn btn-danger" onClick={handleDelete} disabled={selectedIds.length === 0}>
                    🗑️ Usuń ({selectedIds.length})
                </button>
                <button className="btn btn-secondary" onClick={handleImport}>
                    📤 Importuj
                </button>
                <button className="btn btn-secondary" disabled>
                    🗺️ Wyświetl mapę
                </button>
                <button className="btn btn-primary" onClick={handleAddNew}>
                    ➕ Dodaj klienta
                </button>
            </div>

            <div style={{
                marginTop: '1rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
                borderRadius: '8px',
                overflow: 'hidden'
            }}>
                <table className="data-table" style={{ 
                    width: '100%', 
                    borderCollapse: 'collapse',
                    backgroundColor: '#1e2533'
                }}>
                    <thead>
                    <tr style={{ backgroundColor: '#2d3748' }}>
                        <th style={{ 
                            width: '40px',
                            padding: '0.75rem',
                            borderBottom: '1px solid #4a5568',
                            color: '#e2e8f0',
                            textAlign: 'left'
                        }}></th>
                        <th style={{ 
                            width: '50px',
                            padding: '0.75rem',
                            borderBottom: '1px solid #4a5568',
                            color: '#e2e8f0',
                            textAlign: 'left'
                        }}>Lp.</th>
                        <th
                            className={`sortable-header ${sortField === 'imie' ? `sorted-${sortDirection}` : ''}`}
                            onClick={() => handleSort('imie')}
                            style={{
                                padding: '0.75rem',
                                borderBottom: '1px solid #4a5568',
                                color: '#e2e8f0',
                                textAlign: 'left',
                                cursor: 'pointer',
                                userSelect: 'none'
                            }}
                        >
                            Imię {sortField === 'imie' ? (sortDirection === 'asc' ? '↑' : '↓') : '⇅'}
                        </th>
                        <th
                            className={`sortable-header ${sortField === 'nazwisko' ? `sorted-${sortDirection}` : ''}`}
                            onClick={() => handleSort('nazwisko')}
                            style={{
                                padding: '0.75rem',
                                borderBottom: '1px solid #4a5568',
                                color: '#e2e8f0',
                                textAlign: 'left',
                                cursor: 'pointer',
                                userSelect: 'none'
                            }}
                        >
                            Nazwisko {sortField === 'nazwisko' ? (sortDirection === 'asc' ? '↑' : '↓') : '⇅'}
                        </th>
                        <th style={{
                            padding: '0.75rem',
                            borderBottom: '1px solid #4a5568',
                            color: '#e2e8f0',
                            textAlign: 'left'
                        }}>Ulica</th>
                        <th style={{
                            padding: '0.75rem',
                            borderBottom: '1px solid #4a5568',
                            color: '#e2e8f0',
                            textAlign: 'left'
                        }}>Kod pocztowy</th>
                        <th style={{
                            padding: '0.75rem',
                            borderBottom: '1px solid #4a5568',
                            color: '#e2e8f0',
                            textAlign: 'left'
                        }}>Miejscowość</th>
                        <th style={{
                            padding: '0.75rem',
                            borderBottom: '1px solid #4a5568',
                            color: '#e2e8f0',
                            textAlign: 'left'
                        }}>Telefon</th>
                        <th
                            className={`sortable-header ${sortField === 'dataUrodzenia' ? `sorted-${sortDirection}` : ''}`}
                            onClick={() => handleSort('dataUrodzenia')}
                            style={{
                                padding: '0.75rem',
                                borderBottom: '1px solid #4a5568',
                                color: '#e2e8f0',
                                textAlign: 'left',
                                cursor: 'pointer',
                                userSelect: 'none'
                            }}
                        >
                            Data urodzenia {sortField === 'dataUrodzenia' ? (sortDirection === 'asc' ? '↑' : '↓') : '⇅'}
                        </th>
                        <th style={{
                            padding: '0.75rem',
                            borderBottom: '1px solid #4a5568',
                            color: '#e2e8f0',
                            textAlign: 'left'
                        }}>Adnotacje</th>
                        <th
                            className={`sortable-header ${sortField === 'iloscWystapien' ? `sorted-${sortDirection}` : ''}`}
                            onClick={() => handleSort('iloscWystapien')}
                            style={{
                                padding: '0.75rem',
                                borderBottom: '1px solid #4a5568',
                                color: '#e2e8f0',
                                textAlign: 'left',
                                cursor: 'pointer',
                                userSelect: 'none'
                            }}
                        >
                            Ilość wystąpień {sortField === 'iloscWystapien' ? (sortDirection === 'asc' ? '↑' : '↓') : '⇅'}
                        </th>
                        <th style={{
                            padding: '0.75rem',
                            borderBottom: '1px solid #4a5568',
                            color: '#e2e8f0',
                            textAlign: 'left'
                        }}>Grupa</th>
                    </tr>
                    </thead>
                    <tbody>
                    {paginatedKlienci.length === 0 ? (
                        <tr>
                            <td colSpan={12} style={{ 
                                padding: '2rem', 
                                textAlign: 'center', 
                                color: '#a0aec0' 
                            }}>
                                {searchTerm ? 'Brak klientów dla podanych kryteriów.' : 'Brak klientów.'}
                            </td>
                        </tr>
                    ) : (
                        paginatedKlienci.map((klient, index) => {
                            const isSelected = selectedIds.includes(klient.idKlient);
                            const globalIndex = (currentPage - 1) * rowsPerPage + index + 1;
                            const rowBg = isSelected 
                                ? '#4a5568' 
                                : index % 2 === 0 
                                    ? '#1e2533' 
                                    : '#252d3d';
                            return (
                                <tr
                                    key={klient.idKlient}
                                    style={{
                                        backgroundColor: rowBg,
                                        cursor: 'pointer',
                                        transition: 'background-color 0.15s ease'
                                    }}
                                    onClick={() => handleRowClick(klient.idKlient)}
                                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = '#3a4556'; }}
                                    onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = rowBg; }}
                                >
                                    <td style={{ padding: '0.6rem 0.75rem' }} onClick={(e) => e.stopPropagation()}>
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => handleRowClick(klient.idKlient)}
                                        />
                                    </td>
                                    <td style={{ padding: '0.6rem 0.75rem', color: '#e2e8f0' }}>{globalIndex}</td>
                                    <td style={{ padding: '0.6rem 0.75rem', color: '#e2e8f0' }}>{klient.imie}</td>
                                    <td style={{ padding: '0.6rem 0.75rem', color: '#e2e8f0' }}>{klient.nazwisko}</td>
                                    <td style={{ padding: '0.6rem 0.75rem', color: '#e2e8f0' }}>{klient.ulica || '---'}</td>
                                    <td style={{ padding: '0.6rem 0.75rem', color: '#e2e8f0' }}>{klient.kodPocztowy || '---'}</td>
                                    <td style={{ padding: '0.6rem 0.75rem', color: '#e2e8f0' }}>{klient.miejscowosc || '---'}</td>
                                    <td style={{ padding: '0.6rem 0.75rem', color: '#e2e8f0' }}>{klient.telefon || '---'}</td>
                                    <td style={{ padding: '0.6rem 0.75rem', color: '#e2e8f0' }}>{klient.dataUrodzenia || '---'}</td>
                                    <td style={{ padding: '0.6rem 0.75rem', color: '#e2e8f0' }}>{klient.adnotacje || '---'}</td>
                                    <td style={{ padding: '0.6rem 0.75rem', color: '#e2e8f0' }}>{klient.iloscWystapien || 0}</td>
                                    <td style={{ padding: '0.6rem 0.75rem', color: '#e2e8f0' }}>{klient.nazwaGrupy || '---'}</td>
                                </tr>
                            );
                        })
                    )}
                    </tbody>
                </table>
            </div>

            {/* Paginacja */}
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
                    <span>z {filteredAndSortedKlienci.length} klientów</span>
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

export default KlienciPage;
