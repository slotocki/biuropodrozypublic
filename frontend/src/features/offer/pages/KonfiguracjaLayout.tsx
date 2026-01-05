// pages/offer/KonfiguracjaLayout.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import styles from './OfertaLayout.module.css';

const KonfiguracjaLayout = () => {
    return (
        <div className={styles.pageWrapper}>
            <header className={styles.dashboardHeader}>
                <h1>Konfiguracja Ofert</h1>
                <Link to="/oferta" className="btn btn-secondary" style={{ marginTop: '1rem' }}>
                    ← Powrót do Ofert
                </Link>
            </header>

            <div className={styles.tileGrid}>
                <Link to="/oferta/konfiguracja/destynacje" className={styles.tile}>
                    <h3>Destynacje</h3>
                    <p>Zarządzaj destynacjami wyjazdów.</p>
                </Link>

                <Link to="/oferta/konfiguracja/transport" className={styles.tile}>
                    <h3>Transport</h3>
                    <p>Rodzaje transportu.</p>
                </Link>

                <Link to="/oferta/konfiguracja/wyzywienie" className={styles.tile}>
                    <h3>Wyżywienie</h3>
                    <p>Rodzaje wyżywienia.</p>
                </Link>

                <Link to="/oferta/konfiguracja/miejsca-odjazdu" className={styles.tile}>
                    <h3>Miejsca odjazdu</h3>
                    <p>Zarządzaj miejscami odjazdu.</p>
                </Link>
            </div>
        </div>
    );
};

export default KonfiguracjaLayout;

