import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import apiClient from '@/api/apiClient';
import { useNotification } from '@/context/NotificationContext';
import '@/pages/PageStyles.css';
import styles from './GaleriaPage.module.css';
import ZdjecieModal from '@/components/offer/modals/ZdjecieModal';

interface ZdjecieOferty {
    idZdjecie: number;
    sciezkaPliku: string;
    opisZdjecia?: string;
    tagi?: string;
    czyGlowne: boolean;
    sourceType: 'osrodek' | 'destynacja';
    nazwaOsrodka?: string;
    nazwaDestynacji?: string;
}

const OfertaGaleriaPage = () => {
    const { id } = useParams<{ id: string }>();
    const { showToast } = useNotification();
    const [zdjecia, setZdjecia] = useState<ZdjecieOferty[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedZdjecie, setSelectedZdjecie] = useState<ZdjecieOferty | null>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const fetchZdjecia = useCallback(async () => {
        setLoading(true);
        try {
            const response = await apiClient.get(`/api/oferta/${id}/galeria`);
            setZdjecia(response.data);
        } catch (err) {
            showToast('Nie udało się pobrać galerii oferty.', 'error');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [id, showToast]);

    useEffect(() => {
        fetchZdjecia();
    }, [fetchZdjecia]);

    const handleZdjecieClick = (zdjecie: ZdjecieOferty) => {
        const index = zdjecia.findIndex(z => z.idZdjecie === zdjecie.idZdjecie);
        setCurrentImageIndex(index);
        setSelectedZdjecie(zdjecie);
        setIsViewModalOpen(true);
    };

    const handleNextImage = () => {
        if (currentImageIndex < zdjecia.length - 1) {
            const nextIndex = currentImageIndex + 1;
            setCurrentImageIndex(nextIndex);
            setSelectedZdjecie(zdjecia[nextIndex]);
        }
    };

    const handlePrevImage = () => {
        if (currentImageIndex > 0) {
            const prevIndex = currentImageIndex - 1;
            setCurrentImageIndex(prevIndex);
            setSelectedZdjecie(zdjecia[prevIndex]);
        }
    };

    if (loading) {
        return <p className="loading-text">Ładowanie galerii oferty...</p>;
    }

    return (
        <div className="page-container">
            {isViewModalOpen && selectedZdjecie && (
                <ZdjecieModal
                    zdjecie={selectedZdjecie}
                    allZdjecia={zdjecia}
                    onClose={() => setIsViewModalOpen(false)}
                    onNext={handleNextImage}
                    onPrev={handlePrevImage}
                />
            )}

            <header className="page-header">
                <h1>Galeria oferty</h1>
            </header>

            <div className={styles.galeriaGrid}>
                {zdjecia.map((zdjecie) => (
                    <div key={zdjecie.idZdjecie} className={styles.zdjecieCard}>
                        {zdjecie.czyGlowne && (
                            <div className={styles.badge}>⭐ Główne</div>
                        )}
                        <img
                            src={zdjecie.sciezkaPliku}
                            alt={zdjecie.opisZdjecia || 'Zdjęcie'}
                            className={styles.zdjecieImage}
                            onClick={() => handleZdjecieClick(zdjecie)}
                        />
                        <div className={styles.zdjecieInfo}>
                            <p className={styles.opisZdjecia}>
                                {zdjecie.opisZdjecia || 'Brak opisu'}
                            </p>
                            {zdjecie.tagi && (
                                <div className={styles.tagi}>
                                    {zdjecie.tagi.split(',').map((tag, idx) => (
                                        <span key={idx} className={styles.tag}>
                                            {tag.trim()}
                                        </span>
                                    ))}
                                </div>
                            )}
                            <div className={styles.przypisanie}>
                                {zdjecie.sourceType === 'osrodek' && zdjecie.nazwaOsrodka && (
                                    <span>🏨 {zdjecie.nazwaOsrodka}</span>
                                )}
                                {zdjecie.sourceType === 'destynacja' && zdjecie.nazwaDestynacji && (
                                    <span>📍 {zdjecie.nazwaDestynacji}</span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {zdjecia.length === 0 && !loading && (
                <p className={styles.emptyState}>
                    Brak zdjęć dla tej oferty. Dodaj zdjęcia do destynacji lub ośrodków.
                </p>
            )}
        </div>
    );
};

export default OfertaGaleriaPage;
