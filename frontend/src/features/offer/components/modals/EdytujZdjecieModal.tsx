// components/offer/modal/EdytujZdjecieModal.tsx
import React, { useState, useEffect } from 'react';
import apiClient from '@/common/api/apiClient';
import { useNotification } from '@/common/context/NotificationContext';
import styles from './DodajZdjeciaModal.module.css'; // U ywamy tych samych styli

interface Zdjecie {
    idZdjecie: number;
    idOsrodek?: number;
    idDestynacja?: number;
    sciezkaPliku: string;
    opisZdjecia?: string;
    tagi?: string;
    czyGlowne: boolean;
}

interface Osrodek {
    idOsrodek: number;
    nazwaOsrodka: string;
}

interface Destynacja {
    idDestynacja: number;
    nazwa: string;
}

interface Props {
    zdjecie: Zdjecie;
    onClose: () => void;
    onSuccess: () => void;
}

const EdytujZdjecieModal: React.FC<Props> = ({ zdjecie, onClose, onSuccess }) => {
    const { showToast } = useNotification();
    const [osrodki, setOsrodki] = useState<Osrodek[]>([]);
    const [destynacje, setDestynacje] = useState<Destynacja[]>([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        idOsrodek: zdjecie.idOsrodek?.toString() || '',
        idDestynacja: zdjecie.idDestynacja?.toString() || '',
        opisZdjecia: zdjecie.opisZdjecia || '',
        tagi: zdjecie.tagi || '',
        czyGlowne: zdjecie.czyGlowne
    });

    useEffect(() => {
        fetchOsrodki();
        fetchDestynacje();
    }, []);

    const fetchOsrodki = async () => {
        try {
            const response = await apiClient.get('/api/Zdjecia/osrodki');
            setOsrodki(response.data);
        } catch (err) {
            console.error('Błąd pobierania ośrodków:', err);
        }
    };

    const fetchDestynacje = async () => {
        try {
            const response = await apiClient.get('/api/Zdjecia/destynacje');
            setDestynacje(response.data);
        } catch (err) {
            console.error('Błąd pobierania destynacji:', err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const dataToSend = {
                idOsrodek: formData.idOsrodek ? parseInt(formData.idOsrodek) : null,
                idDestynacja: formData.idDestynacja ? parseInt(formData.idDestynacja) : null,
                opisZdjecia: formData.opisZdjecia || null,
                tagi: formData.tagi || null,
                czyGlowne: formData.czyGlowne
            };

            await apiClient.put(`/api/Zdjecia/${zdjecie.idZdjecie}`, dataToSend);
            showToast('Zdjęcie zaktualizowane pomyślnie.', 'success');
            onSuccess();
        } catch (err: any) {
            showToast(err.response?.data?.message || 'Błąd podczas aktualizacji.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <h2>Edytuj zdjęcie</h2>

                    <div className={styles.formGroup}>
                        <label>Podgląd</label>
                        <img
                            src={zdjecie.sciezkaPliku}
                            alt="Podgląd"
                            style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: '8px', backgroundColor: '#1a202c' }}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Opis zdjęcia</label>
                        <input
                            type="text"
                            placeholder="Opis zdjęcia"
                            value={formData.opisZdjecia}
                            onChange={(e) => setFormData({ ...formData, opisZdjecia: e.target.value })}
                            className={styles.input}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Ośrodek (opcjonalnie)</label>
                        <select
                            value={formData.idOsrodek}
                            onChange={(e) => setFormData({ ...formData, idOsrodek: e.target.value })}
                            className={styles.select}
                        >
                            <option value="">-- Brak --</option>
                            {osrodki.map(o => (
                                <option key={o.idOsrodek} value={o.idOsrodek}>
                                    {o.nazwaOsrodka}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Destynacja (opcjonalnie)</label>
                        <select
                            value={formData.idDestynacja}
                            onChange={(e) => setFormData({ ...formData, idDestynacja: e.target.value })}
                            className={styles.select}
                        >
                            <option value="">-- Brak --</option>
                            {destynacje.map(d => (
                                <option key={d.idDestynacja} value={d.idDestynacja}>
                                    {d.nazwa}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Tagi (oddzielone przecinkami)</label>
                        <input
                            type="text"
                            placeholder="np. plaża, zachód słońca, morze"
                            value={formData.tagi}
                            onChange={(e) => setFormData({ ...formData, tagi: e.target.value })}
                            className={styles.input}
                        />
                    </div>

                    <div className={styles.checkboxGroup}>
                        <label>
                            <input
                                type="checkbox"
                                checked={formData.czyGlowne}
                                onChange={(e) => setFormData({ ...formData, czyGlowne: e.target.checked })}
                            />
                            <span>Zdjęcie główne</span>
                        </label>
                    </div>

                    <div className={styles.buttonContainer}>
                        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                            Anuluj
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Zapisywanie...' : 'Zapisz zmiany'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EdytujZdjecieModal;
