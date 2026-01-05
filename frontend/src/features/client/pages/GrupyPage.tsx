import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '@/common/api/apiClient';
import { useNotification } from '@/common/context/NotificationContext';
import '@/common/styles/PageStyles.css';
import GrupaForm from '@/features/client/components/form/GrupaForm';
import KlienciGrupyModal from '@/features/client/components/modals/KlienciGrupyModal';
import type { Grupa, Klient } from '@/common/types';
import styles from './GrupyPage.module.css';

const GrupyPage = () => {
    const { showToast, showConfirm } = useNotification();
    const [grupy, setGrupy] = useState<Grupa[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [selectedGrupa, setSelectedGrupa] = useState<Grupa | null>(null);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [expandedGrupaId, setExpandedGrupaId] = useState<number | null>(null);
    const [grupaKlienci, setGrupaKlienci] = useState<Map<number, Klient[]>>(new Map());
    const [isKlienciModalVisible, setIsKlienciModalVisible] = useState(false);
    const [currentGrupaForKlienci, setCurrentGrupaForKlienci] = useState<Grupa | null>(null);

    const fetchGrupy = useCallback(async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/api/grupy');
            setGrupy(response.data);
        } catch (err) {
            setError('Nie udało się pobrać listy grup.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchGrupy();
    }, [fetchGrupy]);

    const fetchKlienciGrupy = async (grupaId: number) => {
        try {
            const response = await apiClient.get(`/api/grupy/${grupaId}`);
            const klienci = response.data.klienci || [];
            setGrupaKlienci(prev => new Map(prev).set(grupaId, klienci));
        } catch (error) {
            console.error('Błąd podczas pobierania klientów grupy:', error);
            showToast('Nie udało się pobrać klientów grupy.', 'error');
        }
    };

    const handleExpandGrupa = async (grupaId: number) => {
        if (expandedGrupaId === grupaId) {
            setExpandedGrupaId(null);
        } else {
            setExpandedGrupaId(grupaId);
            if (!grupaKlienci.has(grupaId)) {
                await fetchKlienciGrupy(grupaId);
            }
        }
    };

    const handleAddNew = () => {
        setSelectedGrupa(null);
        setIsFormVisible(true);
    };

    const handleEdit = () => {
        if (selectedIds.length !== 1) {
            showToast('Zaznacz dokładnie jedną grupę do edycji.', 'warning');
            return;
        }
        const grupa = grupy.find(g => g.idGrupa === selectedIds[0]);
        if (grupa) {
            setSelectedGrupa(grupa);
            setIsFormVisible(true);
        }
    };

    const handleSave = () => {
        setIsFormVisible(false);
        setSelectedIds([]);
        fetchGrupy();
        showToast('Grupa została zapisana pomyślnie.', 'success');
    };

    const handleDelete = async () => {
        if (selectedIds.length === 0) {
            showToast('Zaznacz grupy do usunięcia.', 'warning');
            return;
        }

        const confirmed = await showConfirm(
            'Potwierdzenie usunięcia',
            `Czy na pewno chcesz usunąć ${selectedIds.length} grup(ę)?`
        );

        if (confirmed) {
            try {
                const deletePromises = selectedIds.map(async (id) => {
                    try {
                        await apiClient.delete(`/api/grupy/${id}`);
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
                    showToast(`Usunięto ${succeeded.length} grup(ę)`, 'success');
                }

                if (failed.length > 0) {
                    failed.forEach(f => showToast(f.message, 'error'));
                }

                setSelectedIds([]);
                fetchGrupy();
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

    const handleManageKlienci = (grupa: Grupa) => {
        setCurrentGrupaForKlienci(grupa);
        setIsKlienciModalVisible(true);
    };

    const handleKlienciSaved = async () => {
        setIsKlienciModalVisible(false);
        await fetchGrupy();
        if (currentGrupaForKlienci && expandedGrupaId === currentGrupaForKlienci.idGrupa) {
            await fetchKlienciGrupy(currentGrupaForKlienci.idGrupa);
        }
        showToast('Klienci zostali zaktualizowani.', 'success');
    };

    const handleRemoveKlientFromGrupa = async (grupaId: number, klientId: number) => {
        const confirmed = await showConfirm(
            'Usuń klienta z grupy',
            'Czy na pewno chcesz usunąć tego klienta z grupy?'
        );

        if (confirmed) {
            try {
                await apiClient.delete(`/api/grupy/${grupaId}/klienci/${klientId}`);
                showToast('Klient został usunięty z grupy.', 'success');
                await fetchKlienciGrupy(grupaId);
                await fetchGrupy();
            } catch (error) {
                showToast('Wystąpił błąd podczas usuwania klienta z grupy.', 'error');
                console.error(error);
            }
        }
    };

    const filteredGrupy = grupy.filter(grupa =>
        grupa.nazwaGrupy.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <p className="loading-text">Ładowanie grup...</p>;
    if (error) return <p className="error-text">{error}</p>;

    return (
        <div className="page-container">
            {isFormVisible && (
                <GrupaForm
                    grupaToEdit={selectedGrupa}
                    onSave={handleSave}
                    onCancel={() => setIsFormVisible(false)}
                />
            )}

            {isKlienciModalVisible && currentGrupaForKlienci && (
                <KlienciGrupyModal
                    grupa={currentGrupaForKlienci}
                    onSave={handleKlienciSaved}
                    onCancel={() => setIsKlienciModalVisible(false)}
                />
            )}

            <header className="page-header">
                <h1>Grupy</h1>
                <input
                    type="text"
                    placeholder="Szukaj po nazwie grupy..."
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
                <button className="btn btn-primary" onClick={handleAddNew}>
                    ➕ Dodaj grupę
                </button>
            </div>

            <table className="data-table">
                <thead>
                <tr>
                    <th style={{ width: '40px' }}></th>
                    <th style={{ width: '50px' }}>Lp.</th>
                    <th>Nazwa grupy</th>
                    <th>Osoba kontaktowa</th>
                    <th>Telefon</th>
                    <th>Adnotacje</th>
                    <th style={{ width: '100px' }}>Ilość członków</th>
                    <th style={{ width: '120px' }}>Ilość wystąpień</th>
                    <th style={{ width: '180px' }}>Akcje</th>
                </tr>
                </thead>
                <tbody>
                {filteredGrupy.map((grupa, index) => (
                    <React.Fragment key={grupa.idGrupa}>
                        <tr
                            className={selectedIds.includes(grupa.idGrupa) ? 'selected-row' : ''}
                            onClick={() => handleRowClick(grupa.idGrupa)}
                            style={{ cursor: 'pointer' }}
                        >
                            <td>
                                <input
                                    type="checkbox"
                                    checked={selectedIds.includes(grupa.idGrupa)}
                                    onChange={() => {}}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </td>
                            <td>{index + 1}</td>
                            <td>{grupa.nazwaGrupy}</td>
                            <td>{grupa.opiekunGrupy || '---'}</td>
                            <td>{grupa.telefonOpiekuna || '---'}</td>
                            <td>{grupa.adnotacje || '---'}</td>
                            <td style={{ textAlign: 'center' }}>{grupa.iloscCzlonkow || 0}</td>
                            <td style={{ textAlign: 'center' }}>{grupa.iloscWystapien || 0}</td>
                            <td onClick={(e) => e.stopPropagation()}>
                                <div className={styles.actionButtons}>
                                    <button
                                        className="btn btn-sm btn-secondary"
                                        onClick={() => handleExpandGrupa(grupa.idGrupa)}
                                        title="Pokaż klientów"
                                    >
                                        {expandedGrupaId === grupa.idGrupa ? '▼' : '▶'} Klienci
                                    </button>
                                    <button
                                        className="btn btn-sm btn-primary"
                                        onClick={() => handleManageKlienci(grupa)}
                                        title="Zarządzaj klientami"
                                    >
                                        👥 Zarządzaj
                                    </button>
                                </div>
                            </td>
                        </tr>
                        {expandedGrupaId === grupa.idGrupa && (
                            <tr>
                                <td colSpan={9} className={styles.expandedRow}>
                                    <div className={styles.klienciContainer}>
                                        <h4>Klienci w grupie: {grupa.nazwaGrupy}</h4>
                                        {grupaKlienci.get(grupa.idGrupa)?.length === 0 ? (
                                            <p className={styles.emptyMessage}>Brak klientów w tej grupie.</p>
                                        ) : (
                                            <table className={styles.klienciTable}>
                                                <thead>
                                                <tr>
                                                    <th>Lp.</th>
                                                    <th>Imię i nazwisko</th>
                                                    <th>Email</th>
                                                    <th>Telefon</th>
                                                    <th>Akcje</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {grupaKlienci.get(grupa.idGrupa)?.map((klient, idx) => (
                                                    <tr key={klient.idKlient}>
                                                        <td>{idx + 1}</td>
                                                        <td>{klient.imie} {klient.nazwisko}</td>
                                                        <td>{klient.email || '---'}</td>
                                                        <td>{klient.telefon || '---'}</td>
                                                        <td>
                                                            <button
                                                                className="btn btn-sm btn-danger"
                                                                onClick={() => handleRemoveKlientFromGrupa(grupa.idGrupa, klient.idKlient)}
                                                            >
                                                                🗑️ Usuń
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        )}
                    </React.Fragment>
                ))}
                </tbody>
            </table>
        </div>
    );
};

export default GrupyPage;
