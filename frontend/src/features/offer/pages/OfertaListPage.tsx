import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ofertaApi } from '@/common/api/ofertaApi';
import type { OfertaSummary, OfertaSearchParams } from '@/common/api/ofertaApi';
import OfertaSearchBar from '@/features/offer/components/OfertaSearchBar';
import { useNotification } from '@/common/context/NotificationContext';
import styles from './OfertaListPage.module.css';

// Interfejs dla zgrupowanych ofert
interface GrupowaneOferty {
    nazwaHandlowa: string;
    destynacja: string;
    oferty: OfertaSummary[];
}

export const OfertaListPage: React.FC = () => {
    const navigate = useNavigate();
    const { showToast } = useNotification();
    const [oferty, setOferty] = useState<OfertaSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchParams, setSearchParams] = useState<OfertaSearchParams>({
        tylkoAktywne: true,
    });
    const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

    useEffect(() => {
        fetchOferty(searchParams);
    }, []);

    const fetchOferty = async (params: OfertaSearchParams) => {
        setLoading(true);
        try {
            const data = await ofertaApi.getOferty(params);
            setOferty(data);
        } catch (err) {
            console.error('Błąd podczas pobierania ofert:', err);
            showToast('Nie udało się pobrać ofert', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (params: OfertaSearchParams) => {
        setSearchParams(params);
        fetchOferty(params);
    };

    // Grupowanie ofert po nazwie handlowej
    const grupowaneOferty: GrupowaneOferty[] = React.useMemo(() => {
        const grupy: Record<string, OfertaSummary[]> = {};
        oferty.forEach(oferta => {
            const klucz = oferta.nazwaHandlowa;
            if (!grupy[klucz]) {
                grupy[klucz] = [];
            }
            grupy[klucz].push(oferta);
        });
        return Object.entries(grupy).map(([nazwaHandlowa, oferty]) => ({
            nazwaHandlowa,
            destynacja: oferty[0]?.nazwaDestynacji || 'Brak destynacji',
            oferty: oferty
                .slice()
                .sort((a, b) =>
                    a.cenaOd - b.cenaOd ||
                    new Date(a.terminOd).getTime() - new Date(b.terminOd).getTime())
        }));
    }, [oferty]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('pl-PL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    const toggleGroup = (key: string) => setOpenGroups(prev => ({
        ...prev,
        [key]: !prev[key]
    }));

    return (
        <div className="page-container">
            <header className="page-header">
                <h1>Oferty</h1>
                <button
                    onClick={() => navigate('/oferta/nowa')}
                    className="btn btn-primary"
                >
                    ➕ Dodaj ofertę
                </button>
            </header>

            <OfertaSearchBar onSearch={handleSearch} />

            <div className={styles.mainContent}>
                {loading ? (
                    <p className={styles.loadingText}>Ładowanie ofert...</p>
                ) : grupowaneOferty.length === 0 ? (
                    <p className={styles.noResults}>
                        Brak ofert spełniających kryteria wyszukiwania
                    </p>
                ) : (
                    grupowaneOferty.map((grupa) => {
                        const showAll = openGroups[grupa.nazwaHandlowa] || false;
                        const najtansza = grupa.oferty[0];
                        const reszta = grupa.oferty.slice(1);
                        return (
                            <div className={styles.groupBox} key={grupa.nazwaHandlowa}>
                                <div className={styles.headRow}>
                                    <span className={styles.groupTitle}>{grupa.nazwaHandlowa}</span>
                                    <span className={styles.groupDest}>{grupa.destynacja}</span>
                                    <span className={styles.groupTermsInfo}>
                                        {grupa.oferty.length} termin{grupa.oferty.length === 1 ? '' : 'y'}
                                    </span>
                                </div>
                                {/* Jeden termin */}
                                {grupa.oferty.length === 1 && (
                                    <div className={styles.termRow} onClick={() => navigate(`/oferta/szczegoly/${najtansza.idOferta}`)}>
                                        <span className={styles.termDate}>
                                            {formatDate(najtansza.terminOd)} - {formatDate(najtansza.terminDo)}
                                        </span>
                                        <span className={styles.termTransport}>{najtansza.rodzajTransportu}</span>
                                        <span className={styles.termPrice}>{najtansza.cenaOd.toFixed(2)} zł</span>
                                        <span className={styles.termRooms}>
                                            {typeof najtansza.wolneMiejsca === 'number'
                                                ? najtansza.wolneMiejsca
                                                : '-'} pokoje
                                        </span>
                                        <button
                                            className={styles.detailsBtn}
                                            onClick={e => {
                                                e.stopPropagation();
                                                navigate(`/oferta/szczegoly/${najtansza.idOferta}`);
                                            }}
                                        >
                                            Szczegóły →
                                        </button>
                                    </div>
                                )}
                                {/* Wiele terminów */}
                                {grupa.oferty.length > 1 && (
                                    <>
                                        <div className={styles.termRowHighlight}>
                                            <span className={styles.termDate}>
                                                {formatDate(najtansza.terminOd)} - {formatDate(najtansza.terminDo)}
                                            </span>
                                            <span className={styles.termTransport}>{najtansza.rodzajTransportu}</span>
                                            <span className={styles.termPrice}>{najtansza.cenaOd.toFixed(2)} zł</span>
                                            <span className={styles.termRooms}>
                                                {typeof najtansza.wolneMiejsca === 'number'
                                                    ? najtansza.wolneMiejsca
                                                    : '-'} pokoje
                                            </span>
                                            <button
                                                className={styles.detailsBtn}
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    navigate(`/oferta/szczegoly/${najtansza.idOferta}`);
                                                }}
                                            >
                                                Szczegóły →
                                            </button>
                                            {/* Przycisk rozwijania tylko przy najtańszym */}
                                            {reszta.length > 0 && (
                                                <button
                                                    className={styles.expandBtn}
                                                    onClick={e => { e.stopPropagation(); toggleGroup(grupa.nazwaHandlowa); }}
                                                >
                                                    {showAll ? "▲ Zwiń" : "▼ Pozostałe terminy"}
                                                </button>
                                            )}
                                        </div>
                                        {showAll && (
                                            <div className={styles.expandedList}>
                                                {reszta.map(oferta => (
                                                    <div className={styles.termRow}
                                                         key={oferta.idOferta}
                                                         onClick={() => navigate(`/oferta/szczegoly/${oferta.idOferta}`)}
                                                    >
                                                        <span className={styles.termDate}>
                                                            {formatDate(oferta.terminOd)} - {formatDate(oferta.terminDo)}
                                                        </span>
                                                        <span className={styles.termTransport}>{oferta.rodzajTransportu}</span>
                                                        <span className={styles.termPrice}>{oferta.cenaOd.toFixed(2)} zł</span>
                                                        <span className={styles.termRooms}>
                                                            {typeof oferta.wolneMiejsca === 'number'
                                                                ? oferta.wolneMiejsca
                                                                : '-'} pokoje
                                                        </span>
                                                        <button
                                                            className={styles.detailsBtn}
                                                            onClick={e => {
                                                                e.stopPropagation();
                                                                navigate(`/oferta/szczegoly/${oferta.idOferta}`);
                                                            }}
                                                        >
                                                            Szczegóły →
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                )}
                                {!grupa.oferty[0].czyAktywna && (
                                    <div className={styles.inactiveStatus}>
                                        ⚠️ Ta oferta jest zarchiwizowana
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default OfertaListPage;
