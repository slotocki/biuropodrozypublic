import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '@/common/context/AuthContext';
import { useNotification } from '@/common/context/NotificationContext';
import styles from './LoginForm.module.css';

const LoginForm = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const { showToast } = useNotification();

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        try {
            const response = await axios.post('http://localhost:5224/login?useCookies=false', {
                email: email,
                password: password,
            });

            const token = response.data.accessToken;

            if (token) {
                console.log('Token otrzymany:', token);
                login(token);
                showToast('Zalogowano pomyślnie!', 'success');
            } else {
                showToast('Nie otrzymano tokenu autoryzacyjnego.', 'error');
            }

        } catch (err: any) {
            console.error('Błąd logowania:', err);

            if (err.response?.status === 401) {
                showToast('Nieprawidłowy email lub hasło.', 'error');
            } else {
                showToast('Nie udało się zalogować. Spróbuj ponownie.', 'error');
            }
        }
    };

    return (
        <div className={styles.loginContainer}>
            <form onSubmit={handleSubmit} className={styles.loginForm}>
                {/* ✅ Logo na górze formularza */}
                <div className={styles.logoContainer}>
                    <img
                        src="http://localhost:5224/images/umownik.png"
                        alt="Umownik Logo"
                        className={styles.logo}
                    />
                    <h1 className={styles.appName}>Umownik 1.0</h1>
                </div>

                <h2 className={styles.title}>Logowanie</h2>
                <p className={styles.subtitle}>Zaloguj się do swojego konta</p>

                <div className={styles.formGroup}>
                    <label htmlFor="email" className={styles.label}>
                        📧 Email
                    </label>
                    <input
                        type="email"
                        id="email"
                        className={styles.input}
                        placeholder="twoj@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="password" className={styles.label}>
                        🔒 Hasło
                    </label>
                    <input
                        type="password"
                        id="password"
                        className={styles.input}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                <button type="submit" className={styles.submitButton}>
                    Zaloguj się
                </button>
            </form>
        </div>
    );
};

export default LoginForm;
