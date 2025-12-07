import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import styles from './KlienciLayout.module.css';

const KlienciLayout = () => {
    return (
        <div className={styles.pageWrapper}>
            <header className={styles.dashboardHeader}>
                <h1>Moduł Klientów</h1>
            </header>
            <div className={styles.tileGrid}>
                {/* Dodaj rezerwację */}
                <div className={styles.tile} style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                    <h3>Dodaj rezerwację</h3>
                    <p>Utwórz nową rezerwację - wkrótce dostępne.</p>
                </div>

                {/* Rezerwacje */}
                <div className={styles.tile} style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                    <h3>Rezerwacje</h3>
                    <p>Zarządzaj rezerwacjami klientów - wkrótce dostępne.</p>
                </div>

                {/* Klienci */}
                <Link to="/klienci/lista" className={styles.tile}>
                    <h3>Klienci</h3>
                    <p>Zarządzaj bazą klientów.</p>
                </Link>

                {/* Grupy */}
                <Link to="/klienci/grupy" className={styles.tile}>
                    <h3>Grupy</h3>
                    <p>Zarządzaj grupami klientów.</p>
                </Link>

                {/* Rozliczenia */}
                <div className={styles.tile} style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                    <h3>Rozliczenia</h3>
                    <p>Zarządzaj rozliczeniami klientów - wkrótce dostępne.</p>
                </div>

                {/* SMSy */}
                <div className={styles.tile} style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                    <h3>SMSy</h3>
                    <p>Wysyłaj wiadomości SMS - wkrótce dostępne.</p>
                </div>

                {/* Import Excel */}
                
            </div>

            <div style={{ marginTop: '2rem' }}>
                <Outlet />
            </div>
        </div>
    );
};

export default KlienciLayout;
