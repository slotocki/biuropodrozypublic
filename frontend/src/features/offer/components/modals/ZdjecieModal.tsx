// components/offer/modals/ZdjecieModal.tsx
import React, { useEffect, useCallback } from 'react';
import styles from './ZdjecieModal.module.css';


interface Zdjecie {
    idZdjecie: number;
    sciezkaPliku: string;
    opisZdjecia?: string;
    tagi?: string;
    czyGlowne: boolean;
    nazwaOsrodka?: string;
    nazwaDestynacji?: string;
}

interface Props {
    zdjecie: Zdjecie;
    allZdjecia: Zdjecie[];  // ✅ DODANE - lista wszystkich zdjęć
    onClose: () => void;
    onNext?: () => void;     // ✅ DODANE
    onPrev?: () => void;     // ✅ DODANE
}

const ZdjecieModal: React.FC<Props> = ({ zdjecie, allZdjecia, onClose, onNext, onPrev }) => {

    // ✅ DODANE - obsługa klawiatury
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'ArrowRight' && onNext) {
            onNext();
        } else if (e.key === 'ArrowLeft' && onPrev) {
            onPrev();
        } else if (e.key === 'Escape') {
            onClose();
        }
    }, [onNext, onPrev, onClose]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    // ✅ DODANE - sprawdź czy są następne/poprzednie
    const currentIndex = allZdjecia.findIndex(z => z.idZdjecie === zdjecie.idZdjecie);
    const hasPrev = currentIndex > 0;
    const hasNext = currentIndex < allZdjecia.length - 1;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeButton} onClick={onClose}>
                    ✕
                </button>

                {/* ✅ DODANE - Przycisk poprzedni */}
                {hasPrev && (
                    <button
                        className={styles.navButton + ' ' + styles.navButtonLeft}
                        onClick={(e) => {
                            e.stopPropagation();
                            onPrev?.();
                        }}
                    >
                        ‹
                    </button>
                )}

                {/* ✅ DODANE - Przycisk następny */}
                {hasNext && (
                    <button
                        className={styles.navButton + ' ' + styles.navButtonRight}
                        onClick={(e) => {
                            e.stopPropagation();
                            onNext?.();
                        }}
                    >
                        ›
                    </button>
                )}

                <img
                    src={zdjecie.sciezkaPliku}
                    alt={zdjecie.opisZdjecia || 'Zdjęcie'}
                    className={styles.image}
                />

                <div className={styles.info}>
                    {zdjecie.czyGlowne && (
                        <div className={styles.badge}>⭐ Zdjęcie główne</div>
                    )}

                    {zdjecie.opisZdjecia && (
                        <p className={styles.opis}>{zdjecie.opisZdjecia}</p>
                    )}

                    {zdjecie.tagi && (
                        <div className={styles.tagi}>
                            <strong>Tagi:</strong>
                            <div className={styles.tagiList}>
                                {zdjecie.tagi.split(',').map((tag, idx) => (
                                    <span key={idx} className={styles.tag}>
                                        {tag.trim()}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className={styles.przypisanie}>
                        {zdjecie.nazwaOsrodka && (
                            <p>🏨 <strong>Ośrodek:</strong> {zdjecie.nazwaOsrodka}</p>
                        )}
                        {zdjecie.nazwaDestynacji && (
                            <p>📍 <strong>Destynacja:</strong> {zdjecie.nazwaDestynacji}</p>
                        )}
                    </div>

                    {/* ✅ DODANE - licznik */}
                    <p className={styles.counter}>
                        {currentIndex + 1} / {allZdjecia.length}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ZdjecieModal;
