// src/components/offer/OfertaCard.tsx
import React, { useState } from 'react';
import type { OfertaSummary } from '@/api/ofertaApi';
import { useNavigate } from 'react-router-dom';
import '@/pages/PageStyles.css';
import styles from './OfertaCard.module.css';

interface OfertaCardProps {
    oferta: OfertaSummary;
}

export const OfertaCard: React.FC<OfertaCardProps> = ({ oferta }) => {
    const [expanded, setExpanded] = useState(false);
    const navigate = useNavigate();

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('pl-PL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const handleDetailsClick = () => {
        navigate(`/oferta/szczegoly/${oferta.idOferta}`);
    };

    return (
        <div className={styles.card}>
            <div className={styles.cardContent}>
                <div className={styles.cardHeader}>
                    <div className={styles.cardInfo}>
                        <h3 className={styles.cardTitle}>{oferta.nazwaHandlowa}</h3>

                        <div className={styles.infoRow}>
                            <span>📍</span>
                            <span>{oferta.nazwaDestynacji || 'Brak destynacji'}</span>
                        </div>

                        <div className={styles.infoRow}>
                            <span>📅</span>
                            <span>{formatDate(oferta.terminOd)} - {formatDate(oferta.terminDo)}</span>
                        </div>

                        <div className={styles.infoRow}>
                            <span>👥</span>
                            <span style={{ color: oferta.wolneMiejsca > 0 ? '#68d391' : '#fc8181' }}>
                {oferta.wolneMiejsca > 0
                    ? `${oferta.wolneMiejsca} wolnych miejsc`
                    : 'Brak wolnych miejsc'}
              </span>
                        </div>
                    </div>

                    <div className={styles.priceContainer}>
                        <div className={styles.priceLabel}>od</div>
                        <div className={styles.price}>{oferta.cenaOd.toFixed(2)} zł</div>
                        <div className={styles.priceSubtext}>za osobę</div>
                    </div>
                </div>

                <div className={styles.badges}>
          <span className={`${styles.badge} ${oferta.czyAktywna ? styles.badgeActive : styles.badgeInactive}`}>
            {oferta.czyAktywna ? 'Aktywna' : 'Nieaktywna'}
          </span>
                    {oferta.rodzajTransportu && (
                        <span className={`${styles.badge} ${styles.badgeTransport}`}>
              {oferta.rodzajTransportu}
            </span>
                    )}
                </div>

                <div className={styles.cardActions}>
                    <button onClick={handleDetailsClick} className="btn btn-primary" style={{ flex: 1 }}>
                        Zobacz szczegóły
                    </button>
                    <button onClick={() => setExpanded(!expanded)} className="btn btn-secondary">
                        {expanded ? '▲ Zwiń' : '▼ Rozwiń'}
                    </button>
                </div>
            </div>

            {expanded && (
                <div className={styles.expandedContent}>
                    <p>Dodatkowe informacje o ofercie</p>
                </div>
            )}
        </div>
    );
};

export default OfertaCard;
