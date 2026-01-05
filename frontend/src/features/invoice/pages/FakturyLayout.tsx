import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import styles from './FakturyLayout.module.css';

const FakturyLayout = () => {
    return (
        <div className={styles.pageWrapper}> {/* ✅ Dodaj wrapper z paddingiem */}
            <header className={styles.dashboardHeader}>
                <h1>Moduł Faktur VAT</h1>
            </header>
            <div className={styles.tileGrid}>
                <Link to="/faktury/nowa" className={styles.tile}>
                    <h3>Wystaw fakturę</h3>
                    <p>Przejdź do formularza.</p>
                </Link>
                <Link to="/faktury/lista" className={styles.tile}>
                    <h3>Lista faktur</h3>
                    <p>Przeglądaj wystawione faktury.</p>
                </Link>
                <Link to="/kontrahenci" className={styles.tile}>
                    <h3>Kontrahenci</h3>
                    <p>Zarządzaj bazą kontrahentów.</p>
                </Link>
            </div>

            <div style={{ marginTop: '2rem' }}>
                <Outlet />
            </div>
        </div>
    );
};

export default FakturyLayout;
