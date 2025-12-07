// pages/offer/OsrodkiPage.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/api/apiClient';
import { useNotification } from '@/context/NotificationContext';
import '@/pages/PageStyles.css';
import styles from './OsrodkiPage.module.css';
import OsrodekModal from '@/components/offer/modals/OsrodekModal';

interface Osrodek {
    idOsrodek: number;
    nazwaOsrodka: string;
    adres: string;
    adresPelny: {
        ulica?: string;
        kodPocztowy?: string;
        miejscowosc?: string;
    };
    opis?: string;
    adnotacje?: string;
    idDestynacja: number;
    nazwaDestynacji?: string;
    idWyzywienie: number;
    nazwaWyzywienia?: string;
    glowneZdjecie?: string;
    liczbaZdjec: number;
    liczbaPokoi: number;
    liczbaDoplatDzieci: number;
}

interface Destynacja {
    idDestynacja: number;
    nazwa: string;
}

type SortField = 'nazwaOsrodka' | 'nazwaDestynacji' | 'liczbaPokoi' | 'liczbaZdjec';
type SortOrder = 'asc' | 'desc';

const OsrodkiPage = () => {
    const navigate = useNavigate();
    const { showToast, showConfirm } = useNotification();
    const [osrodki, setOsrodki] = useState<Osrodek[]>([]);
    const [destynacje, setDestynacje] = useState<Destynacja[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDestynacja, setFilterDestynacja] = useState<number | ''>('');
    const [selectedOsrodek, setSelectedOsrodek] = useState<Osrodek | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [sortField, setSortField] = useState<SortField>('nazwaOsrodka');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

    const fetchDestynacje = useCallback(async () => {
        try {
            const response = await apiClient.get('/api/SimpleDictionary/destynacja');
            setDestynacje(response.data);
        } catch (err) {
            console.error('Błąd pobierania destynacji:', err);
        }
    }, []);

    const fetchOsrodki = useCallback(async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (searchTerm) params.search = searchTerm;
            if (filterDestynacja) params.idDestynacja = filterDestynacja;

            const response = await apiClient.get('/api/Osrodek', { params });
            setOsrodki(response.data);
        } catch (err) {
            console.error('Błąd pobierania ośrodków:', err);
            if (osrodki.length === 0) {
                showToast('Nie udało się pobrać ośrodków.', 'error');
            }
        } finally {
            setLoading(false);
        }
    }, [searchTerm, filterDestynacja]);

    useEffect(() => {
        fetchDestynacje();
    }, [fetchDestynacje]);

    useEffect(() => {
        const debounce = setTimeout(() => {
            fetchOsrodki();
        }, 300);
        return () => clearTimeout(debounce);
    }, [searchTerm, filterDestynacja, fetchOsrodki]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    const sortedOsrodki = useMemo(() => {
        return [...osrodki].sort((a, b) => {
            let aValue: any = a[sortField];
            let bValue: any = b[sortField];

            if (aValue === undefined || aValue === null) aValue = '';
            if (bValue === undefined || bValue === null) bValue = '';

            if (typeof aValue === 'string') aValue = aValue.toLowerCase();
            if (typeof bValue === 'string') bValue = bValue.toLowerCase();

            if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
    }, [osrodki, sortField, sortOrder]);

    const getSortIcon = (field: SortField) => {
        if (sortField !== field) return ' ⇅';
        return sortOrder === 'asc' ? ' ↑' : ' ↓';
    };

    const handleEdit = () => {
        if (selectedIds.length !== 1) {
            showToast('Zaznacz dokładnie jeden ośrodek do edycji.', 'warning');
            return;
        }
        const osrodek = osrodki.find(o => o.idOsrodek === selectedIds[0]);
        if (osrodek) {
            setSelectedOsrodek(osrodek);
            setIsModalOpen(true);
        }
    };

    const handleDelete = async () => {
        if (selectedIds.length === 0) {
            showToast('Zaznacz ośrodki do usunięcia.', 'warning');
            return;
        }

        const confirmed = await showConfirm(
            'Potwierdzenie usunięcia',
            `Czy na pewno chcesz usunąć ${selectedIds.length} ośrodków?`
        );

        if (confirmed) {
            try {
                await Promise.all(selectedIds.map(id => apiClient.delete(`/api/Osrodek/${id}`)));
                showToast(`Usunięto ${selectedIds.length} ośrodków.`, 'success');
                setSelectedIds([]);
                fetchOsrodki();
            } catch (err: any) {
                showToast(err.response?.data?.message || 'Błąd podczas usuwania.', 'error');
            }
        }
    };

    const handleViewDetails = (id: number) => {
        navigate(`/oferta/osrodki/${id}`);
    };

    const toggleSelect = (id: number) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = (checked: boolean) => {
        setSelectedIds(checked ? osrodki.map(o => o.idOsrodek) : []);
    };

    if (loading && osrodki.length === 0) {
        return <p className="loading-text">Ładowanie ośrodków...</p>;
    }

    return (
        <div className="page-container">
            {isModalOpen && (
                <OsrodekModal
                    osrodek={selectedOsrodek}
                    onClose={() => {
                        setIsModalOpen(false);
                        setSelectedOsrodek(null);
                    }}
                    onSuccess={() => {
                        setIsModalOpen(false);
                        setSelectedOsrodek(null);
                        setSelectedIds([]);
                        fetchOsrodki();
                    }}
                />
            )}

            <header className="page-header">
                <h1>Ośrodki</h1>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <input
                        type="text"
                        placeholder="Szukaj ośrodka lub destynacji..."
                        className="search-input"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{ flex: 1, minWidth: '250px' }}
                    />
                    <select
                        className="search-input"
                        value={filterDestynacja}
                        onChange={e => setFilterDestynacja(e.target.value ? parseInt(e.target.value) : '')}
                        style={{ minWidth: '200px' }}
                    >
                        <option value="">Wszystkie destynacje</option>
                        {destynacje.map(d => (
                            <option key={d.idDestynacja} value={d.idDestynacja}>
                                {d.nazwa}
                            </option>
                        ))}
                    </select>
                </div>
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
                    ➕ Dodaj ośrodek
                </button>
            </div>

            <div className={styles.osrodkiGrid}>
                {sortedOsrodki.length === 0 ? (
                    <p className={styles.emptyState}>
                        {searchTerm || filterDestynacja
                            ? 'Nie znaleziono ośrodków.'
                            : 'Brak ośrodków. Dodaj pierwszy ośrodek!'}
                    </p>
                ) : (
                    sortedOsrodki.map((osrodek) => (
                        <div
                            key={osrodek.idOsrodek}
                            className={`${styles.osrodekCard} ${selectedIds.includes(osrodek.idOsrodek) ? styles.selected : ''}`}
                        >
                            <div className={styles.checkboxContainer}>
                                <input
                                    type="checkbox"
                                    checked={selectedIds.includes(osrodek.idOsrodek)}
                                    onChange={() => toggleSelect(osrodek.idOsrodek)}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>

                            {osrodek.glowneZdjecie ? (
                                <img
                                    src={osrodek.glowneZdjecie}
                                    alt={osrodek.nazwaOsrodka}
                                    className={styles.zdjecieOsrodka}
                                    onClick={() => handleViewDetails(osrodek.idOsrodek)}
                                />
                            ) : (
                                <div
                                    className={styles.zdjeciePlaceholder}
                                    onClick={() => handleViewDetails(osrodek.idOsrodek)}
                                >
                                    🏨
                                </div>
                            )}

                            <div className={styles.osrodekInfo}>
                                <h3 onClick={() => handleViewDetails(osrodek.idOsrodek)}>
                                    {osrodek.nazwaOsrodka}
                                </h3>

                                <div className={styles.infoRow}>
                                    <span>📍 {osrodek.nazwaDestynacji || 'Brak destynacji'}</span>
                                </div>

                                {osrodek.adres && (
                                    <div className={styles.infoRow}>
                                        <span>🗺️ {osrodek.adres}</span>
                                    </div>
                                )}

                                {osrodek.nazwaWyzywienia && (
                                    <div className={styles.infoRow}>
                                        <span>🍴 {osrodek.nazwaWyzywienia}</span>
                                    </div>
                                )}

                                {osrodek.opis && (
                                    <p className={styles.opis}>
                                        {osrodek.opis.substring(0, 100)}
                                        {osrodek.opis.length > 100 ? '...' : ''}
                                    </p>
                                )}

                                {osrodek.adnotacje && (
                                    <div className={styles.adnotacje}>
                                        💡 {osrodek.adnotacje}
                                    </div>
                                )}

                                <div className={styles.statsRow}>
                                    <span>🛏️ {osrodek.liczbaPokoi} pokoi</span>
                                    <span>📷 {osrodek.liczbaZdjec} zdjęć</span>
                                </div>

                                <button
                                    className={styles.btnSzczegoly}
                                    onClick={() => handleViewDetails(osrodek.idOsrodek)}
                                >
                                    Szczegóły →
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default OsrodkiPage;
