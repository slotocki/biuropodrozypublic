import React from 'react';
import { Link } from 'react-router-dom';
import NotatkiPanel from '@/components/NotatkiPanel';
import styles from './HomePage.module.css';

const HomePage = () => {
    return (
        <div className={styles.pageWrapper}>
            <div className={styles.dashboardContainer}>
                <div className={styles.heroSection}>
                    <div className={styles.heroContent}>
                        <h1 className={styles.mainTitle}>Panel Główny</h1>
                        <p className={styles.subtitle}>
                            Witaj w systemie zarządzania biurem turystycznym. Wybierz moduł, aby rozpocząć pracę.
                        </p>
                    </div>
                </div>

                <div className={styles.tileGrid}>
                    <Link to="/faktury" className={styles.tile}>
                        <div className={styles.tileIcon}>📄</div>
                        <h3 className={styles.tileTitle}>Faktury VAT</h3>
                        <p className={styles.tileDescription}>
                            Zarządzanie fakturami, kontrahentami i dokumentacją finansową.
                        </p>
                        <span className={styles.tileArrow}>→</span>
                    </Link>

                    {/* ✅ ZMIENIONE: Aktywny link do modułu ofert */}
                    <Link to="/oferta" className={styles.tile}>
                        <div className={styles.tileIcon}>📅</div>
                        <h3 className={styles.tileTitle}>Oferta</h3>
                        <p className={styles.tileDescription}>
                            Zarządzanie ofertami, ośrodkami i promocjami.
                        </p>
                        <span className={styles.tileArrow}>→</span>
                    </Link>

                    <Link to="/klienci" className={styles.tile}>
                        <div className={styles.tileIcon}>👥</div>
                        <h3 className={styles.tileTitle}>Klienci</h3>
                        <p className={styles.tileDescription}>
                            Baza klientów, rezerwacji i rozliczeń.
                        </p>
                        <span className={styles.tileArrow}>→</span>
                    </Link>
                </div>

                <NotatkiPanel />
            </div>
        </div>
    );
};

export default HomePage;
