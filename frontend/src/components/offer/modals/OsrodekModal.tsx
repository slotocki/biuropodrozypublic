// components/offer/modals/OsrodekModal.tsx
import React, { useState, useEffect } from 'react';
import apiClient from '@/api/apiClient';
import { useNotification } from '@/context/NotificationContext';
import styles from './OsrodekModal.module.css';

interface Osrodek {
    idOsrodek: number;
    nazwaOsrodka: string;
    idDestynacja: number;
    idWyzywienie: number;
    ulica?: string;
    kodPocztowy?: string;
    miejscowosc?: string;
    opis?: string;
    adnotacje?: string;
}

interface Destynacja {
    idDestynacja: number;
    nazwa: string;
}

interface Wyzywienie {
    idWyzywienie: number;
    rodzajWyzywienia: string;
}

interface Props {
    osrodek?: Osrodek | null;
    onClose: () => void;
    onSuccess: () => void;
}

const OsrodekModal: React.FC<Props> = ({ osrodek, onClose, onSuccess }) => {
    const { showToast } = useNotification();
    const [loading, setLoading] = useState(false);
    const [destynacje, setDestynacje] = useState<Destynacja[]>([]);
    const [wyzywienia, setWyzywienia] = useState<Wyzywienie[]>([]);
    const isEditMode = !!osrodek;

    const [formData, setFormData] = useState({
        nazwaOsrodka: osrodek?.nazwaOsrodka || '',
        idDestynacja: osrodek?.idDestynacja || '',
        idWyzywienie: osrodek?.idWyzywienie || '',
        ulica: osrodek?.ulica || '',
        kodPocztowy: osrodek?.kodPocztowy || '',
        miejscowosc: osrodek?.miejscowosc || '',
        opis: osrodek?.opis || '',
        adnotacje: osrodek?.adnotacje || ''
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [destResponse, wyzResponse] = await Promise.all([
                    apiClient.get('/api/SimpleDictionary/destynacja'),
                    apiClient.get('/api/SimpleDictionary/wyzywienie')
                ]);
                setDestynacje(destResponse.data);
                setWyzywienia(wyzResponse.data);
            } catch (err) {
                showToast('Błąd pobierania słowników.', 'error');
            }
        };
        fetchData();
    }, [showToast]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.idDestynacja || !formData.idWyzywienie) {
            showToast('Wybierz destynację i wyżywienie.', 'warning');
            return;
        }

        setLoading(true);

        try {
            const dataToSend = {
                nazwaOsrodka: formData.nazwaOsrodka,
                idDestynacja: parseInt(formData.idDestynacja as any),
                idWyzywienie: parseInt(formData.idWyzywienie as any),
                ulica: formData.ulica || null,
                kodPocztowy: formData.kodPocztowy || null,
                miejscowosc: formData.miejscowosc || null,
                opis: formData.opis || null,
                adnotacje: formData.adnotacje || null
            };

            if (isEditMode) {
                await apiClient.put(`/api/Osrodek/${osrodek.idOsrodek}`, dataToSend);
                showToast('Ośrodek zaktualizowany pomyślnie.', 'success');
            } else {
                await apiClient.post('/api/Osrodek', dataToSend);
                showToast('Ośrodek dodany pomyślnie.', 'success');
            }

            onSuccess();
        } catch (err: any) {
            showToast(err.response?.data?.message || 'Błąd podczas zapisu.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <h2>{isEditMode ? 'Edytuj ośrodek' : 'Dodaj ośrodek'}</h2>

                    <div className={styles.formGroup}>
                        <label>Nazwa ośrodka *</label>
                        <input
                            type="text"
                            value={formData.nazwaOsrodka}
                            onChange={(e) => setFormData({ ...formData, nazwaOsrodka: e.target.value })}
                            className={styles.input}
                            required
                            maxLength={200}
                            placeholder="np. OW Góral"
                        />
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>Destynacja *</label>
                            <select
                                value={formData.idDestynacja}
                                onChange={(e) => setFormData({ ...formData, idDestynacja: e.target.value })}
                                className={styles.input}
                                required
                            >
                                <option value="">Wybierz destynację</option>
                                {destynacje.map(d => (
                                    <option key={d.idDestynacja} value={d.idDestynacja}>
                                        {d.nazwa}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label>Wyżywienie *</label>
                            <select
                                value={formData.idWyzywienie}
                                onChange={(e) => setFormData({ ...formData, idWyzywienie: e.target.value })}
                                className={styles.input}
                                required
                            >
                                <option value="">Wybierz wyżywienie</option>
                                {wyzywienia.map(w => (
                                    <option key={w.idWyzywienie} value={w.idWyzywienie}>
                                        {w.rodzajWyzywienia}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Ulica</label>
                        <input
                            type="text"
                            value={formData.ulica}
                            onChange={(e) => setFormData({ ...formData, ulica: e.target.value })}
                            className={styles.input}
                            maxLength={200}
                            placeholder="np. ul. Wypoczynkowa 11"
                        />
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>Kod pocztowy</label>
                            <input
                                type="text"
                                value={formData.kodPocztowy}
                                onChange={(e) => setFormData({ ...formData, kodPocztowy: e.target.value })}
                                className={styles.input}
                                maxLength={10}
                                placeholder="np. 78-111"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Miejscowość</label>
                            <input
                                type="text"
                                value={formData.miejscowosc}
                                onChange={(e) => setFormData({ ...formData, miejscowosc: e.target.value })}
                                className={styles.input}
                                maxLength={100}
                                placeholder="np. Ustronie Morskie"
                            />
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Opis</label>
                        <textarea
                            value={formData.opis}
                            onChange={(e) => setFormData({ ...formData, opis: e.target.value })}
                            className={styles.textarea}
                            rows={4}
                            placeholder="Opis ośrodka..."
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Adnotacje</label>
                        <textarea
                            value={formData.adnotacje}
                            onChange={(e) => setFormData({ ...formData, adnotacje: e.target.value })}
                            className={styles.textarea}
                            rows={2}
                            placeholder="np. Parking bezpłatny, Wi-Fi w całym obiekcie"
                        />
                    </div>

                    <div className={styles.buttonContainer}>
                        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                            Anuluj
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? (isEditMode ? 'Zapisywanie...' : 'Dodawanie...') : (isEditMode ? 'Zapisz zmiany' : 'Dodaj ośrodek')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default OsrodekModal;
