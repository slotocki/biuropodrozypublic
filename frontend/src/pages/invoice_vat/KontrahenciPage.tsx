import React, { useState, useEffect, useCallback, useMemo } from 'react';
import apiClient from '@/api/apiClient';
import { useNotification } from '@/context/NotificationContext';
import '@/pages/PageStyles.css';
import KontrahentForm from '@/components/invoice_vat/form/KontrahentForm';
import type { Kontrahent } from '@/types';

type SortField = 'nazwaFirmy' | 'nip' | 'email' | 'numerTelefonu';
type SortDirection = 'asc' | 'desc' | null;

const KontrahenciPage = () => {
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

    // ✅ USUŃ showToast z dependency array
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
    }, []); // ✅ Pusta tablica zależności

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
                <input
                    type="text"
                    placeholder="Szukaj po nazwie lub NIP..."
                    className="search-input"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </header>

            <div className="action-buttons">
                <button
                    className="btn btn-secondary"
                    onClick={handleEdit}
                    disabled={selectedIds.length !== 1}
                >
                    ✏️ Edytuj
                </button>
                <button
                    className="btn btn-danger"
                    onClick={handleDelete}
                    disabled={selectedIds.length === 0}
                >
                    🗑️ Usuń ({selectedIds.length})
                </button>
                <button
                    className="btn btn-primary"
                    onClick={handleAddNew}
                >
                    ➕ Dodaj nowego kontrahenta
                </button>
            </div>

            <table className="data-table">
                <thead>
                <tr>
                    <th style={{ width: '40px' }}></th>
                    <th
                        className={`sortable-header ${sortField === 'nazwaFirmy' ? `sorted-${sortDirection}` : ''}`}
                        onClick={() => handleSort('nazwaFirmy')}
                    >
                        Nazwa Firmy
                    </th>
                    <th
                        className={`sortable-header ${sortField === 'nip' ? `sorted-${sortDirection}` : ''}`}
                        onClick={() => handleSort('nip')}
                    >
                        NIP
                    </th>
                    <th
                        className={`sortable-header ${sortField === 'email' ? `sorted-${sortDirection}` : ''}`}
                        onClick={() => handleSort('email')}
                    >
                        Email
                    </th>
                    <th
                        className={`sortable-header ${sortField === 'numerTelefonu' ? `sorted-${sortDirection}` : ''}`}
                        onClick={() => handleSort('numerTelefonu')}
                    >
                        Telefon
                    </th>
                </tr>
                </thead>
                <tbody>
                {filteredAndSortedKontrahenci.map((kontrahent) => (
                    <tr
                        key={kontrahent.idKontrahent}
                        className={selectedIds.includes(kontrahent.idKontrahent) ? 'selected-row' : ''}
                        onClick={() => handleRowClick(kontrahent.idKontrahent)}
                        style={{ cursor: 'pointer' }}
                    >
                        <td>
                            <input
                                type="checkbox"
                                checked={selectedIds.includes(kontrahent.idKontrahent)}
                                onChange={() => {}}
                                onClick={(e) => e.stopPropagation()}
                            />
                        </td>
                        <td>{kontrahent.nazwaFirmy}</td>
                        <td>{kontrahent.nip || '---'}</td>
                        <td>{kontrahent.email || '---'}</td>
                        <td>{kontrahent.numerTelefonu || '---'}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};

export default KontrahenciPage;
