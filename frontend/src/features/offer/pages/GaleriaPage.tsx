// pages/offer/GaleriaPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '@/common/api/apiClient';
import { useNotification } from '@/common/context/NotificationContext';
import '@/common/styles/PageStyles.css';
import styles from './GaleriaPage.module.css';
import ZdjecieModal from '@/features/offer/components/modals/ZdjecieModal';
import DodajZdjeciaModal from '@/features/offer/components/modals/DodajZdjeciaModal';
import EdytujZdjecieModal from '@/features/offer/components/modals/EdytujZdjecieModal';

interface Zdjecie {
    idZdjecie: number;
    idOsrodek?: number;
    idDestynacja?: number;
    sciezkaPliku: string;
    opisZdjecia?: string;
    tagi?: string;
    czyGlowne: boolean;
    nazwaOsrodka?: string;
    nazwaDestynacji?: string;
}

const GaleriaPage = () => {
    const { showToast, showConfirm } = useNotification();
    const [zdjecia, setZdjecia] = useState<Zdjecie[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedZdjecie, setSelectedZdjecie] = useState<Zdjecie | null>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isDodajModalOpen, setIsDodajModalOpen] = useState(false);
    const [isEdytujModalOpen, setIsEdytujModalOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);  // ✅ DODANE

    const fetchZdjecia = useCallback(async () => {
        setLoading(true);
        try {
            const params = searchTerm ? { search: searchTerm } : {};
            const response = await apiClient.get('/api/Zdjecia', { params });
            setZdjecia(response.data);
        } catch (err) {
            showToast('Nie udało się pobrać zdjęć.', 'error');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [searchTerm, showToast]);

    useEffect(() => {
        const debounce = setTimeout(() => {
            fetchZdjecia();
        }, 800);  // ✅ ZMIENIONE z 300 na 800ms

        return () => clearTimeout(debounce);
    }, [searchTerm, fetchZdjecia]);

    const handleZdjecieClick = (zdjecie: Zdjecie) => {
        const index = zdjecia.findIndex(z => z.idZdjecie === zdjecie.idZdjecie);  // ✅ DODANE
        setCurrentImageIndex(index);  // ✅ DODANE
        setSelectedZdjecie(zdjecie);
        setIsViewModalOpen(true);
    };

    // ✅ DODANE - funkcje nawigacji
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

    const handleEdit = () => {
        if (selectedIds.length !== 1) {
            showToast('Zaznacz dokładnie jedno zdjęcie do edycji.', 'warning');
            return;
        }
        const zdjecie = zdjecia.find(z => z.idZdjecie === selectedIds[0]);
        if (zdjecie) {
            setSelectedZdjecie(zdjecie);
            setIsEdytujModalOpen(true);
        }
    };

    const handleDelete = async () => {
        if (selectedIds.length === 0) {
            showToast('Zaznacz zdjęcia do usunięcia.', 'warning');
            return;
        }

        const confirmed = await showConfirm(
            'Potwierdzenie usunięcia',
            `Czy na pewno chcesz usunąć ${selectedIds.length} zdjęć? Ta operacja jest nieodwracalna.`
        );

        if (confirmed) {
            try {
                await Promise.all(selectedIds.map(id => apiClient.delete(`/api/Zdjecia/${id}`)));
                showToast(`Usunięto ${selectedIds.length} zdjęć.`, 'success');
                setSelectedIds([]);
                fetchZdjecia();
            } catch (err: any) {
                showToast(err.response?.data?.message || 'Błąd podczas usuwania.', 'error');
            }
        }
    };

    const handleCheckboxChange = (id: number) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    if (loading && zdjecia.length === 0) {
        return <p className="loading-text">Ładowanie galerii...</p>;
    }

    return (
        <div className="page-container">
            {isViewModalOpen && selectedZdjecie && (
                <ZdjecieModal
                    zdjecie={selectedZdjecie}
                    allZdjecia={zdjecia}  // ✅ DODANE
                    onClose={() => setIsViewModalOpen(false)}
                    onNext={handleNextImage}  // ✅ DODANE
                    onPrev={handlePrevImage}  // ✅ DODANE
                />
            )}

            {isDodajModalOpen && (
                <DodajZdjeciaModal
                    onClose={() => setIsDodajModalOpen(false)}
                    onSuccess={() => {
                        setIsDodajModalOpen(false);
                        fetchZdjecia();
                    }}
                />
            )}

            {isEdytujModalOpen && selectedZdjecie && (
                <EdytujZdjecieModal
                    zdjecie={selectedZdjecie}
                    onClose={() => setIsEdytujModalOpen(false)}
                    onSuccess={() => {
                        setIsEdytujModalOpen(false);
                        setSelectedIds([]);
                        fetchZdjecia();
                    }}
                />
            )}

            <header className="page-header">
                <h1>Galeria</h1>
                <input
                    type="text"
                    placeholder="Szukaj po tagach lub opisie..."
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
                    onClick={() => setIsDodajModalOpen(true)}
                >
                    ➕ Dodaj zdjęcia
                </button>
            </div>

            <div className={styles.galeriaGrid}>
                {zdjecia.map((zdjecie) => (
                    <div key={zdjecie.idZdjecie} className={styles.zdjecieCard}>
                        <div className={styles.checkboxContainer}>
                            <input
                                type="checkbox"
                                checked={selectedIds.includes(zdjecie.idZdjecie)}
                                onChange={() => handleCheckboxChange(zdjecie.idZdjecie)}
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
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
                                {zdjecie.nazwaOsrodka && (
                                    <span>🏨 {zdjecie.nazwaOsrodka}</span>
                                )}
                                {zdjecie.nazwaDestynacji && (
                                    <span>📍 {zdjecie.nazwaDestynacji}</span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {zdjecia.length === 0 && !loading && (
                <p className={styles.emptyState}>
                    {searchTerm ? 'Nie znaleziono zdjęć.' : 'Brak zdjęć w galerii. Dodaj pierwsze zdjęcie!'}
                </p>
            )}
        </div>
    );
};

export default GaleriaPage;
