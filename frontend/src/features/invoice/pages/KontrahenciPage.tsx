import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import apiClient from '@/common/api/apiClient';
import { useNotification } from '@/common/context/NotificationContext';
import '@/common/styles/PageStyles.css';
import KontrahentForm from '@/features/invoice/components/form/KontrahentForm';
import type { Kontrahent } from '@/common/types';


type SortField = 'nazwaFirmy' | 'nip' | 'email' | 'numerTelefonu';
type SortDirection = 'asc' | 'desc' | null;

// Definicja dostępnych opcji liczby wierszy
const ROWS_OPTIONS = [10, 25, 50, 100];

const KontrahenciPage = () => {
    const [searchParams] = useSearchParams();
    const { showToast, showConfirm } = useNotification();
    const [kontrahenci, setKontrahenci] = useState<Kontrahent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [selectedKontrahent, setSelectedKontrahent] = useState<Kontrahent | null>(null);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    const [sortField, setSortField] = useState<SortField | null>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>(null);

    // ⭐ POPRAWIONE: Domyślna wartość zgodna z ROWS_OPTIONS
    const [rowsPerPage, setRowsPerPage] = useState(ROWS_OPTIONS[0]);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        const searchFromUrl = searchParams.get('search');
        if (searchFromUrl) {
            setSearchTerm(searchFromUrl);
        }
    }, [searchParams]);

    const fetchKontrahenci = useCallback(async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/api/kontrahenci');
            setKontrahenci(response.data);
        } catch (err) {
            setError('Nie udało się pobrać listy kontrahentów.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchKontrahenci();
    }, [fetchKontrahenci]);

    const handleAddNew = () => {
        setSelectedKontrahent(null);
        setIsFormVisible(true);
    };

    const handleEdit = () => {
        if (selectedIds.length !== 1) {
            showToast('Zaznacz dokładnie jednego kontrahenta do edycji.', 'warning');
            return;
        }
        const kontrahent = kontrahenci.find(k => k.idKontrahent === selectedIds[0]);
        if (kontrahent) {
            setSelectedKontrahent(kontrahent);
            setIsFormVisible(true);
        }
    };

    const handleSave = () => {
        setIsFormVisible(false);
        setSelectedIds([]);
        fetchKontrahenci();
        showToast('Kontrahent został zapisany pomyślnie.', 'success');
    };

    const handleDelete = async () => {
        if (selectedIds.length === 0) {
            showToast('Zaznacz kontrahentów do usunięcia.', 'warning');
            return;
        }

        const confirmed = await showConfirm(
            'Potwierdzenie usunięcia',
            `Czy na pewno chcesz usunąć ${selectedIds.length} kontrahent(ów)?`
        );

        if (confirmed) {
            try {
                const deletePromises = selectedIds.map(async (id) => {
                    try {
                        await apiClient.delete(`/api/kontrahenci/${id}`);
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
                    showToast(`Usunięto ${succeeded.length} kontrahent(ów)`, 'success');
                }

                if (failed.length > 0) {
                    failed.forEach(f => {
                        showToast(f.message, 'error');
                    });
                }

                setSelectedIds([]);
                fetchKontrahenci();
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

    const filteredAndSortedKontrahenci = useMemo(() => {
        let result = kontrahenci.filter(kontrahent =>
            kontrahent.nazwaFirmy.toLowerCase().includes(searchTerm.toLowerCase()) ||
            kontrahent.nip?.toLowerCase().includes(searchTerm.toLowerCase())
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
    }, [kontrahenci, searchTerm, sortField, sortDirection]);

    // Paginacja logiczna
    const paginatedKontrahenci = useMemo(() => {
        const start = (currentPage - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        return filteredAndSortedKontrahenci.slice(start, end);
    }, [filteredAndSortedKontrahenci, currentPage, rowsPerPage]);

    const totalPages = Math.ceil(filteredAndSortedKontrahenci.length / rowsPerPage);

    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > totalPages) return;
        setCurrentPage(newPage);
    };

    const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setRowsPerPage(Number(e.target.value));
        setCurrentPage(1); // Powrót na pierwszą stronę przy zmianie gęstości danych
    };

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        setCurrentPage(1); // Reset strony przy nowym wyszukiwaniu
    };

    if (loading) return <p className="loading-text">Ładowanie kontrahentów...</p>;
    if (error) return <p className="error-text">{error}</p>;

    return (
        <div className="page-container">
            {isFormVisible && (
                <KontrahentForm
                    kontrahentToEdit={selectedKontrahent}
                    onSave={handleSave}
                    onCancel={() => setIsFormVisible(false)}
                />
            )}

            <header className="page-header">
                <h1>Kontrahenci</h1>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <input
                        type="text"
                        placeholder="Szukaj po nazwie lub NIP..."
                        className="search-input"
                        value={searchTerm}
                        onChange={e => handleSearchChange(e.target.value)}
                    />
                    {selectedIds.length > 0 && (
                        <>
                            <button
                                className="btn btn-secondary"
                                onClick={handleEdit}
                                disabled={selectedIds.length !== 1}
                                style={{ opacity: selectedIds.length !== 1 ? 0.5 : 1 }}
                            >
                                ✏️ Edytuj
                            </button>
                            <button
                                className="btn btn-danger"
                                onClick={handleDelete}
                            >
                                🗑️ Usuń ({selectedIds.length})
                            </button>
                        </>
                    )}
                    <button
                        className="btn btn-primary"
                        onClick={handleAddNew}
                    >
                        ➕ Dodaj nowego kontrahenta
                    </button>
                </div>
            </header>

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
                        <th style={{ width: '40px', padding: '0.75rem', borderBottom: '1px solid #4a5568' }}></th>
                        <th
                            className={`sortable-header ${sortField === 'nazwaFirmy' ? `sorted-${sortDirection}` : ''}`}
                            onClick={() => handleSort('nazwaFirmy')}
                            style={{ padding: '0.75rem', borderBottom: '1px solid #4a5568', color: '#e2e8f0', textAlign: 'left', cursor: 'pointer', userSelect: 'none' }}
                        >
                            Nazwa Firmy {sortField === 'nazwaFirmy' ? (sortDirection === 'asc' ? '↑' : '↓') : '⇅'}
                        </th>
                        <th
                            className={`sortable-header ${sortField === 'nip' ? `sorted-${sortDirection}` : ''}`}
                            onClick={() => handleSort('nip')}
                            style={{ padding: '0.75rem', borderBottom: '1px solid #4a5568', color: '#e2e8f0', textAlign: 'left', cursor: 'pointer', userSelect: 'none' }}
                        >
                            NIP {sortField === 'nip' ? (sortDirection === 'asc' ? '↑' : '↓') : '⇅'}
                        </th>
                        <th
                            className={`sortable-header ${sortField === 'email' ? `sorted-${sortDirection}` : ''}`}
                            onClick={() => handleSort('email')}
                            style={{ padding: '0.75rem', borderBottom: '1px solid #4a5568', color: '#e2e8f0', textAlign: 'left', cursor: 'pointer', userSelect: 'none' }}
                        >
                            Email {sortField === 'email' ? (sortDirection === 'asc' ? '↑' : '↓') : '⇅'}
                        </th>
                        <th
                            className={`sortable-header ${sortField === 'numerTelefonu' ? `sorted-${sortDirection}` : ''}`}
                            onClick={() => handleSort('numerTelefonu')}
                            style={{ padding: '0.75rem', borderBottom: '1px solid #4a5568', color: '#e2e8f0', textAlign: 'left', cursor: 'pointer', userSelect: 'none' }}
                        >
                            Telefon {sortField === 'numerTelefonu' ? (sortDirection === 'asc' ? '↑' : '↓') : '⇅'}
                        </th>
                    </tr>
                    </thead>
                    <tbody>
                    {paginatedKontrahenci.length === 0 ? (
                        <tr>
                            <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#a0aec0' }}>
                                {searchTerm ? 'Brak kontrahentów dla podanych kryteriów.' : 'Brak kontrahentów.'}
                            </td>
                        </tr>
                    ) : (
                        paginatedKontrahenci.map((kontrahent, index) => {
                            const isSelected = selectedIds.includes(kontrahent.idKontrahent);
                            const rowBg = isSelected ? '#4a5568' : index % 2 === 0 ? '#1e2533' : '#252d3d';
                            return (
                                <tr
                                    key={kontrahent.idKontrahent}
                                    style={{ backgroundColor: rowBg, cursor: 'pointer', transition: 'background-color 0.15s ease' }}
                                    onClick={() => handleRowClick(kontrahent.idKontrahent)}
                                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = '#3a4556'; }}
                                    onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = rowBg; }}
                                >
                                    <td style={{ padding: '0.6rem 0.75rem' }} onClick={(e) => e.stopPropagation()}>
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => handleRowClick(kontrahent.idKontrahent)}
                                        />
                                    </td>
                                    <td style={{ padding: '0.6rem 0.75rem', color: '#e2e8f0' }}>{kontrahent.nazwaFirmy}</td>
                                    <td style={{ padding: '0.6rem 0.75rem', color: '#e2e8f0' }}>{kontrahent.nip || '---'}</td>
                                    <td style={{ padding: '0.6rem 0.75rem', color: '#e2e8f0' }}>{kontrahent.email || '---'}</td>
                                    <td style={{ padding: '0.6rem 0.75rem', color: '#e2e8f0' }}>{kontrahent.numerTelefonu || '---'}</td>
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
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23a0aec0' d='M6 8L2 4h8z'/%3E%3C/svg%3E")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 0.5rem center',
                            backgroundSize: '12px'
                        }}
                    >
                        {/* Renderowanie opcji na podstawie tablicy ROWS_OPTIONS */}
                        {ROWS_OPTIONS.map(option => (
                            <option key={option} value={option}>{option}</option>
                        ))}
                    </select>
                    <span>z {filteredAndSortedKontrahenci.length} kontrahentów</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <button
                        onClick={() => handlePageChange(1)}
                        disabled={currentPage === 1}
                        className="btn-paging"
                    >
                        ««
                    </button>
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="btn-paging"
                    >
                        «
                    </button>
                    <span style={{ padding: '0 0.8rem', color: '#e2e8f0' }}>
                        Strona {currentPage} z {totalPages || 1}
                    </span>
                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages || totalPages === 0}
                        className="btn-paging"
                    >
                        »
                    </button>
                    <button
                        onClick={() => handlePageChange(totalPages)}
                        disabled={currentPage === totalPages || totalPages === 0}
                        className="btn-paging"
                    >
                        »»
                    </button>
                </div>
            </div>
        </div>
    );
};

export default KontrahenciPage;