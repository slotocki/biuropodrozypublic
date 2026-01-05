// pages/offer/OsrodekDetailsPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import apiClient from '@/common/api/apiClient';
import { useNotification } from '@/common/context/NotificationContext';
import '@/common/styles/PageStyles.css';
import styles from './OsrodekDetailsPage.module.css';
import OsrodekModal from '@/features/offer/components/modals/OsrodekModal';
import DoplataModal from '@/features/offer/components/modals/DoplataModal';
import PokojModal from '@/features/offer/components/modals/PokojModal';
import DodajPokojeBulkModal from '@/features/offer/components/modals/DodajPokojeBulkModal';

interface Osrodek {
    idOsrodek: number;
    nazwaOsrodka: string;
    ulica?: string;
    kodPocztowy?: string;
    miejscowosc?: string;
    opis?: string;
    adnotacje?: string;
    idDestynacja: number;
    nazwaDestynacji?: string;
    idWyzywienie: number;
    nazwaWyzywienia?: string;
    glowneZdjecie?: string;
    liczbaZdjec: number;
    liczbaPokoi: number;
}

interface Doplata {
    idDoplata: number;
    nazwaDoplaty: string;
    kwotaDoplaty: number;
    idOsrodek: number;
}

interface Pokoj {
    idPokoj: number;
    idOsrodek: number;
    numerPokoju?: string;
    opisPokoju?: string;
    idRodzajPokoju: number;
    rodzajPokoju: string;
    iloscLozek: number;
    iloscOsob: number;
    maxIloscOsob: number;
}

const OsrodekDetailsPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { showToast, showConfirm } = useNotification();

    const [osrodek, setOsrodek] = useState<Osrodek | null>(null);
    const [doplaty, setDoplaty] = useState<Doplata[]>([]);
    const [pokoje, setPokoje] = useState<Pokoj[]>([]);
    const [loading, setLoading] = useState(true);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDoplataModalOpen, setIsDoplataModalOpen] = useState(false);
    const [isPokojModalOpen, setIsPokojModalOpen] = useState(false);
    const [isBulkPokojModalOpen, setIsBulkPokojModalOpen] = useState(false);

    const [selectedDoplata, setSelectedDoplata] = useState<Doplata | null>(null);
    const [selectedPokoj, setSelectedPokoj] = useState<Pokoj | null>(null);
    const [selectedDoplaty, setSelectedDoplaty] = useState<number[]>([]);
    const [selectedPokoje, setSelectedPokoje] = useState<number[]>([]);

    const fetchOsrodek = async () => {
        try {
            const response = await apiClient.get(`/api/Osrodek/${id}`);
            setOsrodek(response.data);
        } catch (err) {
            showToast('Nie udało się pobrać danych ośrodka.', 'error');
            navigate('/oferta/osrodki');
        }
    };

    const fetchDoplaty = async () => {
        try {
            const response = await apiClient.get(`/api/Doplata?idOsrodek=${id}`);
            setDoplaty(response.data);
        } catch (err) {
            console.error('Błąd pobierania dopłat:', err);
        }
    };

    const fetchPokoje = async () => {
        try {
            const response = await apiClient.get(`/api/Pokoj?idOsrodek=${id}`);
            setPokoje(response.data);
        } catch (err) {
            console.error('Błąd pobierania pokoi:', err);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            await Promise.all([fetchOsrodek(), fetchDoplaty(), fetchPokoje()]);
            setLoading(false);
        };
        fetchData();
    }, [id]);

    const toggleSelectDoplata = (idDoplata: number) => {
        setSelectedDoplaty(prev =>
            prev.includes(idDoplata) ? prev.filter(x => x !== idDoplata) : [...prev, idDoplata]
        );
    };

    const handleEditDoplata = () => {
        if (selectedDoplaty.length !== 1) {
            showToast('Zaznacz dokładnie jedną dopłatę do edycji.', 'warning');
            return;
        }
        const doplata = doplaty.find(d => d.idDoplata === selectedDoplaty[0]);
        if (doplata) {
            setSelectedDoplata(doplata);
            setIsDoplataModalOpen(true);
        }
    };

    const handleDeleteDoplaty = async () => {
        if (selectedDoplaty.length === 0) {
            showToast('Zaznacz dopłaty do usunięcia.', 'warning');
            return;
        }

        const confirmed = await showConfirm(
            'Potwierdzenie usunięcia',
            `Czy na pewno chcesz usunąć ${selectedDoplaty.length} dopłat?`
        );

        if (confirmed) {
            try {
                await Promise.all(selectedDoplaty.map(idDoplata =>
                    apiClient.delete(`/api/Doplata/${idDoplata}?idOsrodek=${id}`)
                ));
                showToast(`Usunięto ${selectedDoplaty.length} dopłat.`, 'success');
                setSelectedDoplaty([]);
                fetchDoplaty();
            } catch (err: any) {
                showToast(err.response?.data?.message || 'Błąd podczas usuwania.', 'error');
            }
        }
    };

    const toggleSelectPokoj = (idPokoj: number) => {
        setSelectedPokoje(prev =>
            prev.includes(idPokoj) ? prev.filter(x => x !== idPokoj) : [...prev, idPokoj]
        );
    };

    const handleEditPokoj = () => {
        if (selectedPokoje.length !== 1) {
            showToast('Zaznacz dokładnie jeden pokój do edycji.', 'warning');
            return;
        }
        const pokoj = pokoje.find(p => p.idPokoj === selectedPokoje[0]);
        if (pokoj) {
            setSelectedPokoj(pokoj);
            setIsPokojModalOpen(true);
        }
    };

    const handleDeletePokoje = async () => {
        if (selectedPokoje.length === 0) {
            showToast('Zaznacz pokoje do usunięcia.', 'warning');
            return;
        }

        const confirmed = await showConfirm(
            'Potwierdzenie usunięcia',
            `Czy na pewno chcesz usunąć ${selectedPokoje.length} pokoi?`
        );

        if (confirmed) {
            try {
                await Promise.all(selectedPokoje.map(idPokoj => apiClient.delete(`/api/Pokoj/${idPokoj}`)));
                showToast(`Usunięto ${selectedPokoje.length} pokoi.`, 'success');
                setSelectedPokoje([]);
                fetchPokoje();
            } catch (err: any) {
                showToast(err.response?.data?.message || 'Błąd podczas usuwania.', 'error');
            }
        }
    };

    if (loading) {
        return <p className="loading-text">Ładowanie...</p>;
    }

    if (!osrodek) {
        return <p>Nie znaleziono ośrodka.</p>;
    }

    return (
        <div className="page-container">
            {isEditModalOpen && (
                <OsrodekModal
                    osrodek={osrodek}
                    onClose={() => setIsEditModalOpen(false)}
                    onSuccess={() => {
                        setIsEditModalOpen(false);
                        fetchOsrodek();
                    }}
                />
            )}

            {isDoplataModalOpen && (
                <DoplataModal
                    doplata={selectedDoplata}
                    idOsrodek={parseInt(id!)}
                    onClose={() => {
                        setIsDoplataModalOpen(false);
                        setSelectedDoplata(null);
                    }}
                    onSuccess={() => {
                        setIsDoplataModalOpen(false);
                        setSelectedDoplata(null);
                        setSelectedDoplaty([]);
                        fetchDoplaty();
                    }}
                />
            )}

            {isPokojModalOpen && (
                <PokojModal
                    pokoj={selectedPokoj}
                    idOsrodek={parseInt(id!)}
                    onClose={() => {
                        setIsPokojModalOpen(false);
                        setSelectedPokoj(null);
                    }}
                    onSuccess={() => {
                        setIsPokojModalOpen(false);
                        setSelectedPokoj(null);
                        setSelectedPokoje([]);
                        fetchPokoje();
                    }}
                />
            )}

            {isBulkPokojModalOpen && (
                <DodajPokojeBulkModal
                    idOsrodek={parseInt(id!)}
                    onClose={() => setIsBulkPokojModalOpen(false)}
                    onSuccess={() => {
                        setIsBulkPokojModalOpen(false);
                        fetchPokoje();
                    }}
                />
            )}

            {/* Header */}
            <header className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Link to="/oferta/osrodki" className="btn btn-secondary">
                        ← Powrót
                    </Link>
                    <h1>{osrodek.nazwaOsrodka}</h1>
                </div>
                <button className="btn btn-primary" onClick={() => setIsEditModalOpen(true)}>
                    ✏️ Edytuj ośrodek
                </button>
            </header>

            {/* Sekcja 1: Podstawowe informacje */}
            <div className={styles.section}>
                <div className={styles.headerLayout}>
                    {/* Lewa kolumna - Zdjęcie */}
                    <div className={styles.imageColumn}>
                        {osrodek.glowneZdjecie ? (
                            <img src={osrodek.glowneZdjecie} alt={osrodek.nazwaOsrodka} className={styles.headerImage} />
                        ) : (
                            <div className={styles.imagePlaceholder}>Brak zdjęcia</div>
                        )}
                    </div>

                    {/* Prawa kolumna - Dane */}
                    <div className={styles.infoColumn}>
                        <div className={styles.infoGrid}>
                            <div className={styles.infoItem}>
                                <strong>Destynacja:</strong>
                                <span>{osrodek.nazwaDestynacji || 'Brak'}</span>
                            </div>

                            <div className={styles.infoItem}>
                                <strong>Wyżywienie:</strong>
                                <span>{osrodek.nazwaWyzywienia || 'Brak'}</span>
                            </div>

                            {(osrodek.ulica || osrodek.miejscowosc) && (
                                <div className={styles.infoItem}>
                                    <strong>Adres:</strong>
                                    <span>
                            {osrodek.ulica && `${osrodek.ulica}, `}
                                        {osrodek.kodPocztowy && `${osrodek.kodPocztowy} `}
                                        {osrodek.miejscowosc}
                        </span>
                                </div>
                            )}

                            {osrodek.opis && (
                                <div className={styles.infoItem} style={{ gridColumn: '1 / -1' }}>
                                    <strong>Opis:</strong>
                                    <p>{osrodek.opis}</p>
                                </div>
                            )}

                            {osrodek.adnotacje && (
                                <div className={styles.adnotacje}>
                                    <strong>Adnotacje:</strong>
                                    <p>{osrodek.adnotacje}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Przycisk galerii pod układem */}
                <Link
                    to={`/oferta/osrodki/${id}/galeria`}
                    className={styles.btnGaleria}
                >
                    Wyświetl galerię ({osrodek.liczbaZdjec} zdjęć)
                </Link>
            </div>


            {/* Sekcja 2: Dopłaty */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2>Dopłaty</h2>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button
                            className="btn btn-secondary"
                            onClick={handleEditDoplata}
                            disabled={selectedDoplaty.length !== 1}
                        >
                            ✏️ Edytuj
                        </button>
                        <button
                            className="btn btn-danger"
                            onClick={handleDeleteDoplaty}
                            disabled={selectedDoplaty.length === 0}
                        >
                            🗑️ Usuń ({selectedDoplaty.length})
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={() => {
                                setSelectedDoplata(null);
                                setIsDoplataModalOpen(true);
                            }}
                        >
                            ➕ Dodaj
                        </button>
                    </div>
                </div>

                {doplaty.length === 0 ? (
                    <p className={styles.emptyState}>Brak dopłat. Dodaj pierwszą dopłatę!</p>
                ) : (
                    <div className={styles.cardGrid}>
                        {doplaty.map(doplata => (
                            <div
                                key={doplata.idDoplata}
                                className={`${styles.card} ${selectedDoplaty.includes(doplata.idDoplata) ? styles.cardSelected : ''}`}
                                onClick={() => toggleSelectDoplata(doplata.idDoplata)}
                            >
                                <div className={styles.cardHeader}>
                                    <input
                                        type="checkbox"
                                        checked={selectedDoplaty.includes(doplata.idDoplata)}
                                        onChange={() => toggleSelectDoplata(doplata.idDoplata)}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                    <h3>{doplata.nazwaDoplaty}</h3>
                                </div>
                                <p className={styles.cardPrice} style={{
                                    color: doplata.kwotaDoplaty < 0 ? '#48bb78' : '#f56565'
                                }}>
                                    {doplata.kwotaDoplaty > 0 ? '+' : ''}{doplata.kwotaDoplaty.toFixed(2)} zł
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Sekcja 3: Pokoje */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2>Pokoje ({pokoje.length})</h2>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button
                            className="btn btn-secondary"
                            onClick={handleEditPokoj}
                            disabled={selectedPokoje.length !== 1}
                        >
                            ✏️ Edytuj
                        </button>
                        <button
                            className="btn btn-danger"
                            onClick={handleDeletePokoje}
                            disabled={selectedPokoje.length === 0}
                        >
                            🗑️ Usuń ({selectedPokoje.length})
                        </button>
                        <button
                            className="btn btn-secondary"
                            onClick={() => setIsBulkPokojModalOpen(true)}
                        >
                            ➕ Dodaj grupę
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={() => {
                                setSelectedPokoj(null);
                                setIsPokojModalOpen(true);
                            }}
                        >
                            ➕ Dodaj
                        </button>
                    </div>
                </div>

                {pokoje.length === 0 ? (
                    <p className={styles.emptyState}>Brak pokoi. Dodaj pierwszy pokój!</p>
                ) : (
                    <>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#cbd5e0', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={selectedPokoje.length === pokoje.length && pokoje.length > 0}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setSelectedPokoje(pokoje.map(p => p.idPokoj));
                                        } else {
                                            setSelectedPokoje([]);
                                        }
                                    }}
                                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#4299e1' }}
                                />
                                Zaznacz wszystkie ({pokoje.length})
                            </label>
                        </div>

                        <div className={styles.cardGrid}>
                            {pokoje.map(pokoj => (
                                <div
                                    key={pokoj.idPokoj}
                                    className={`${styles.card} ${selectedPokoje.includes(pokoj.idPokoj) ? styles.cardSelected : ''}`}
                                    onClick={() => toggleSelectPokoj(pokoj.idPokoj)}
                                >
                                    <div className={styles.cardHeader}>
                                        <input
                                            type="checkbox"
                                            checked={selectedPokoje.includes(pokoj.idPokoj)}
                                            onChange={() => toggleSelectPokoj(pokoj.idPokoj)}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                        <h3>
                                            {pokoj.numerPokoju ? `Pokój ${pokoj.numerPokoju}` : pokoj.rodzajPokoju}
                                        </h3>
                                    </div>
                                    {pokoj.numerPokoju && (
                                        <p style={{ color: '#cbd5e0', fontSize: '0.9rem', margin: '0.5rem 0' }}>
                                            {pokoj.rodzajPokoju}
                                        </p>
                                    )}
                                    {pokoj.opisPokoju && (
                                        <p style={{ color: '#a0aec0', fontSize: '0.85rem', margin: '0.5rem 0', fontStyle: 'italic' }}>
                                            {pokoj.opisPokoju}
                                        </p>
                                    )}
                                    <div className={styles.pokojInfo}>
                                        <span>{pokoj.iloscLozek} łóżek</span>
                                        <span>{pokoj.iloscOsob} os.</span>
                                        <span>Max {pokoj.maxIloscOsob} os.</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default OsrodekDetailsPage;
