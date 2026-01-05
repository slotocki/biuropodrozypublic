// pages/offer/OfertaLayout.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import styles from './OfertaLayout.module.css';

const OfertaLayout = () => {
    return (
        <div className={styles.pageWrapper}>
            <header className={styles.dashboardHeader}>
                <h1>Moduł Ofert</h1>
            </header>

            <div className={styles.tileGrid}>
                {/* ✅ AKTYWOWANY - Lista ofert */}
                <Link to="/oferta/lista" className={styles.tile}>
                    <h3>Lista ofert</h3>
                    <p>Przeglądaj wszystkie oferty.</p>
                </Link>

                <Link to="/oferta/osrodki" className={styles.tile}>
                    <h3>Ośrodki</h3>
                    <p>Zarządzaj ośrodkami.</p>
                </Link>

                <Link to="/oferta/nowa" className={styles.tile}>
                    <h3>Dodaj ofertę</h3>
                    <p>Utwórz nową ofertę.</p>
                </Link>


                <Link to="/oferta/promocje" className={styles.tile}>
                    <h3>Promocje</h3>
                    <p>Rabaty i kody promocyjne.</p>
                </Link>

                <Link to="/oferta/galeria" className={styles.tile}>
                    <h3>Galeria</h3>
                    <p>Zdjęcia ofert i ośrodków.</p>
                </Link>

                <div className={styles.tile} style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                    <h3>Statystyki</h3>
                    <p>Raporty i analizy - wkrótce dostępne.</p>
                </div>

                <Link to="/oferta/konfiguracja" className={styles.tile}>
                    <h3>Konfiguracja</h3>
                    <p>Słowniki: destynacje, transport, wyżywienie, miejsca odjazdu.</p>
                </Link>
            </div>
        </div>
    );
};

export default OfertaLayout;
