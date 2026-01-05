import React, { useState, useEffect, useCallback, useMemo } from 'react';
import apiClient from '@/common/api/apiClient';
import { useNotification } from '@/common/context/NotificationContext';
import '@/common/styles/PageStyles.css';
import KlientForm from '@/features/client/components/form/KlientForm';
import ImportKlientow from '@/features/client/pages/ImportKlientow';
import type { Klient } from '@/common/types';

type SortField = 'imie' | 'nazwisko' | 'iloscWystapien' | 'dataUrodzenia';
type SortDirection = 'asc' | 'desc' | null;

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
                    onChange={e => setSearchTerm(e.target.value)}
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

            <table className="data-table">
                <thead>
                <tr>
                    <th style={{ width: '40px' }}></th>
                    <th style={{ width: '50px' }}>Lp.</th>
                    <th className={`sortable-header ${sortField === 'imie' ? `sorted-${sortDirection}` : ''}`}
                        onClick={() => handleSort('imie')}>Imię</th>
                    <th className={`sortable-header ${sortField === 'nazwisko' ? `sorted-${sortDirection}` : ''}`}
                        onClick={() => handleSort('nazwisko')}>Nazwisko</th>
                    <th>Ulica</th>
                    <th>Kod pocztowy</th>
                    <th>Miejscowość</th>
                    <th>Telefon</th>
                    <th className={`sortable-header ${sortField === 'dataUrodzenia' ? `sorted-${sortDirection}` : ''}`}
                        onClick={() => handleSort('dataUrodzenia')}>Data urodzenia</th>
                    <th>Adnotacje</th>
                    <th className={`sortable-header ${sortField === 'iloscWystapien' ? `sorted-${sortDirection}` : ''}`}
                        onClick={() => handleSort('iloscWystapien')}>Ilość wystąpień</th>
                    <th>Grupa</th>
                </tr>
                </thead>
                <tbody>
                {filteredAndSortedKlienci.map((klient, index) => (
                    <tr
                        key={klient.idKlient}
                        className={selectedIds.includes(klient.idKlient) ? 'selected-row' : ''}
                        onClick={() => handleRowClick(klient.idKlient)}
                        style={{ cursor: 'pointer' }}
                    >
                        <td>
                            <input
                                type="checkbox"
                                checked={selectedIds.includes(klient.idKlient)}
                                onChange={() => {}}
                                onClick={(e) => e.stopPropagation()}
                            />
                        </td>
                        <td>{index + 1}</td>
                        <td>{klient.imie}</td>
                        <td>{klient.nazwisko}</td>
                        <td>{klient.ulica || '---'}</td>
                        <td>{klient.kodPocztowy || '---'}</td>
                        <td>{klient.miejscowosc || '---'}</td>
                        <td>{klient.telefon || '---'}</td>
                        <td>{klient.dataUrodzenia || '---'}</td>
                        <td>{klient.adnotacje || '---'}</td>
                        <td>{klient.iloscWystapien || 0}</td>
                        <td>{klient.nazwaGrupy || '---'}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};

export default KlienciPage;
