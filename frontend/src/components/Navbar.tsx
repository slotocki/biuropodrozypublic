import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Navbar.module.css';

const Navbar = () => {
    const { logout, user } = useAuth(); // ⭐ Dodane user

    return (
        <nav className={styles.navbar}>
            <Link to="/" className={styles.logoLink}>
                <img
                    src="http://localhost:5224/images/umownik.png"
                    alt="Umownik Logo"
                    className={styles.logo}
                />
                <span className={styles.appName}>Umownik 1.0</span>
            </Link>

            <div className={styles.userSection}>
                {user && (
                    <span className={styles.userName}>
                        {user.userName}
                    </span>
                )}
                <button onClick={logout} className={styles.logoutButton}>
                    Wyloguj
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
