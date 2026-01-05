// pages/offer/OsrodekGaleriaPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '@/common/api/apiClient';
import { useNotification } from '@/common/context/NotificationContext';
import '@/common/styles/PageStyles.css';
import styles from './GaleriaPage.module.css';

interface Zdjecie {
    idZdjecie: number;
    sciezkaPliku: string;
    opisZdjecia?: string;
    czyGlowne: boolean;
}

interface Osrodek {
    idOsrodek: number;
    nazwaOsrodka: string;
}

const OsrodekGaleriaPage = () => {
    const { id } = useParams<{ id: string }>();
    const { showToast } = useNotification();
    const [osrodek, setOsrodek] = useState<Osrodek | null>(null);
    const [zdjecia, setZdjecia] = useState<Zdjecie[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedZdjecie, setSelectedZdjecie] = useState<Zdjecie | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [osrodekRes, zdjeciaRes] = await Promise.all([
                apiClient.get(`/api/Osrodek/${id}`),
                apiClient.get(`/api/Osrodek/${id}/galeria`)
            ]);
            setOsrodek(osrodekRes.data);
            setZdjecia(zdjeciaRes.data);
        } catch (err) {
            showToast('Nie udało się pobrać galerii.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    if (loading) {
        return <p className="loading-text">Ładowanie galerii...</p>;
    }

    return (
        <div className="page-container">
            {/* Lightbox - powiększone zdjęcie */}
            {selectedZdjecie && (
                <div
                    className={styles.lightbox}
                    onClick={() => setSelectedZdjecie(null)}
                >
                    <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
                        <button
                            className={styles.closeBtn}
                            onClick={() => setSelectedZdjecie(null)}
                        >
                            ✕
                        </button>
                        <img
                            src={selectedZdjecie.sciezkaPliku}
                            alt={selectedZdjecie.opisZdjecia || 'Zdjęcie'}
                            className={styles.lightboxImage}
                        />
                        {selectedZdjecie.opisZdjecia && (
                            <p className={styles.lightboxCaption}>
                                {selectedZdjecie.opisZdjecia}
                            </p>
                        )}
                    </div>
                </div>
            )}

            <header className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Link to={`/oferta/osrodki/${id}`} className="btn btn-secondary">
                        ← Powrót do ośrodka
                    </Link>
                    <h1>Galeria - {osrodek?.nazwaOsrodka}</h1>
                </div>
            </header>

            {zdjecia.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                    <p style={{ color: '#a0aec0', marginBottom: '1rem' }}>
                        Brak zdjęć dla tego ośrodka.
                    </p>
                    <Link to="/oferta/galeria" className="btn btn-primary">
                        Przejdź do galerii aby dodać zdjęcia
                    </Link>
                </div>
            ) : (
                <div className={styles.galeriaGrid}>
                    {zdjecia.map(zdjecie => (
                        <div
                            key={zdjecie.idZdjecie}
                            className={styles.zdjecieCard}
                            onClick={() => setSelectedZdjecie(zdjecie)}
                            style={{ cursor: 'pointer' }}
                        >
                            <img
                                src={zdjecie.sciezkaPliku}
                                alt={zdjecie.opisZdjecia || 'Zdjęcie'}
                                className={styles.zdjecieImg}
                            />
                            {zdjecie.czyGlowne && (
                                <div className={styles.badgeGlowne}>⭐ Główne</div>
                            )}
                            {zdjecie.opisZdjecia && (
                                <div className={styles.zdjecieOpis}>
                                    {zdjecie.opisZdjecia}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default OsrodekGaleriaPage;
