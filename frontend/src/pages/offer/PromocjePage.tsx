// pages/offer/PromocjePage.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import apiClient from '@/api/apiClient';
import { useNotification } from '@/context/NotificationContext';
import '@/pages/PageStyles.css';
import PromocjaModal from '@/components/offer/modals/PromocjaModal';

interface Promocja {
    idPromocja: number;
    nazwaPromocji: string;
    opis?: string;
    dataOd: string;
    dataDo: string;
    kwotaZnizki?: number;
    procentZnizki?: number;
    czyAktywna: boolean;
}

type SortField = 'nazwaPromocji' | 'dataOd' | 'dataDo' | 'czyAktywna';
type SortOrder = 'asc' | 'desc';

const PromocjePage = () => {
    const { showToast, showConfirm } = useNotification();
    const [promocje, setPromocje] = useState<Promocja[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPromocja, setSelectedPromocja] = useState<Promocja | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [sortField, setSortField] = useState<SortField>('dataOd');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

    const fetchPromocje = useCallback(async () => {
        setLoading(true);
        try {
            const params = searchTerm ? { search: searchTerm } : {};
            const response = await apiClient.get('/api/Promocja', { params });
            setPromocje(response.data);
        } catch (err) {
            console.error('Błąd pobierania promocji:', err);
            if (promocje.length === 0) {
                showToast('Nie udało się pobrać promocji.', 'error');
            }
        } finally {
            setLoading(false);
        }
    }, [searchTerm]);

    useEffect(() => {
        const debounce = setTimeout(() => {
            fetchPromocje();
        }, 300);
        return () => clearTimeout(debounce);
    }, [searchTerm, fetchPromocje]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    const sortedPromocje = useMemo(() => {
        return [...promocje].sort((a, b) => {
            let aValue: any = a[sortField];
            let bValue: any = b[sortField];

            if (sortField === 'dataOd' || sortField === 'dataDo') {
                aValue = new Date(aValue).getTime();
                bValue = new Date(bValue).getTime();
            }

            if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
    }, [promocje, sortField, sortOrder]);

    const getSortIcon = (field: SortField) => {
        if (sortField !== field) return ' ⇅';
        return sortOrder === 'asc' ? ' ↑' : ' ↓';
    };

    const handleEdit = () => {
        if (selectedIds.length !== 1) {
            showToast('Zaznacz dokładnie jedną promocję do edycji.', 'warning');
            return;
        }
        const promocja = promocje.find(p => p.idPromocja === selectedIds[0]);
        if (promocja) {
            setSelectedPromocja(promocja);
            setIsModalOpen(true);
        }
    };

    const handleDelete = async () => {
        if (selectedIds.length === 0) {
            showToast('Zaznacz promocje do usunięcia.', 'warning');
            return;
        }

        const confirmed = await showConfirm(
            'Potwierdzenie usunięcia',
            `Czy na pewno chcesz usunąć ${selectedIds.length} promocji?`
        );

        if (confirmed) {
            try {
                await Promise.all(selectedIds.map(id => apiClient.delete(`/api/Promocja/${id}`)));
                showToast(`Usunięto ${selectedIds.length} promocji.`, 'success');
                setSelectedIds([]);
                fetchPromocje();
            } catch (err: any) {
                showToast(err.response?.data?.message || 'Błąd podczas usuwania.', 'error');
            }
        }
    };

    const toggleSelect = (id: number) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = (checked: boolean) => {
        setSelectedIds(checked ? promocje.map(p => p.idPromocja) : []);
    };

    if (loading && promocje.length === 0) {
        return <p className="loading-text">Ładowanie promocji...</p>;
    }

    return (
        <div className="page-container">
            {isModalOpen && (
                <PromocjaModal
                    promocja={selectedPromocja}
                    onClose={() => {
                        setIsModalOpen(false);
                        setSelectedPromocja(null);
                    }}
                    onSuccess={() => {
                        setIsModalOpen(false);
                        setSelectedPromocja(null);
                        setSelectedIds([]);
                        fetchPromocje();
                    }}
                />
            )}

            <header className="page-header">
                <h1>Promocje</h1>
                <input
                    type="text"
                    placeholder="Szukaj promocji..."
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
                    onClick={() => setIsModalOpen(true)}
                >
                    ➕ Dodaj promocję
                </button>
            </div>

            <table className="data-table">
                <thead>
                <tr>
                    <th style={{ width: '50px' }}>
                        <input
                            type="checkbox"
                            onChange={(e) => toggleSelectAll(e.target.checked)}
                            checked={selectedIds.length === promocje.length && promocje.length > 0}
                        />
                    </th>
                    <th
                        onClick={() => handleSort('nazwaPromocji')}
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                    >
                        Nazwa{getSortIcon('nazwaPromocji')}
                    </th>
                    <th
                        onClick={() => handleSort('dataOd')}
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                    >
                        Data od{getSortIcon('dataOd')}
                    </th>
                    <th
                        onClick={() => handleSort('dataDo')}
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                    >
                        Data do{getSortIcon('dataDo')}
                    </th>
                    <th>Zniżka</th>
                    <th
                        onClick={() => handleSort('czyAktywna')}
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                    >
                        Status{getSortIcon('czyAktywna')}
                    </th>
                </tr>
                </thead>
                <tbody>
                {sortedPromocje.length === 0 ? (
                    <tr>
                        <td colSpan={6}>
                            {searchTerm ? 'Nie znaleziono promocji.' : 'Brak promocji. Dodaj pierwszą promocję!'}
                        </td>
                    </tr>
                ) : (
                    sortedPromocje.map((promocja) => (
                        <tr
                            key={promocja.idPromocja}
                            onClick={() => toggleSelect(promocja.idPromocja)}
                            style={{
                                backgroundColor: selectedIds.includes(promocja.idPromocja) ? '#4a5568' : 'transparent',
                                cursor: 'pointer'
                            }}
                        >
                            <td onClick={(e) => e.stopPropagation()}>
                                <input
                                    type="checkbox"
                                    checked={selectedIds.includes(promocja.idPromocja)}
                                    onChange={() => toggleSelect(promocja.idPromocja)}
                                />
                            </td>
                            <td>
                                <strong>{promocja.nazwaPromocji}</strong>
                                {promocja.opis && (
                                    <div style={{ fontSize: '0.85rem', color: '#a0aec0', marginTop: '0.25rem' }}>
                                        {promocja.opis}
                                    </div>
                                )}
                            </td>
                            <td>{new Date(promocja.dataOd).toLocaleDateString('pl-PL')}</td>
                            <td>{new Date(promocja.dataDo).toLocaleDateString('pl-PL')}</td>
                            <td>
                                {promocja.kwotaZnizki && <div>{promocja.kwotaZnizki.toFixed(2)} zł</div>}
                                {promocja.procentZnizki && <div>{promocja.procentZnizki}%</div>}
                                {!promocja.kwotaZnizki && !promocja.procentZnizki && <span style={{ color: '#a0aec0' }}>Brak</span>}
                            </td>
                            <td>
                                    <span style={{
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '12px',
                                        fontSize: '0.85rem',
                                        fontWeight: 500,
                                        backgroundColor: promocja.czyAktywna ? '#48bb78' : '#718096',
                                        color: 'white'
                                    }}>
                                        {promocja.czyAktywna ? 'Aktywna' : 'Nieaktywna'}
                                    </span>
                            </td>
                        </tr>
                    ))
                )}
                </tbody>
            </table>
        </div>
    );
};

export default PromocjePage;
