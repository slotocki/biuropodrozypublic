// components/offer/modal/DodajZdjeciaModal.tsx
import React, { useState, useEffect } from 'react';
import apiClient from '@/common/api/apiClient';
import { useNotification } from '@/common/context/NotificationContext';
import styles from './DodajZdjeciaModal.module.css';

interface Osrodek {
    idOsrodek: number;
    nazwaOsrodka: string;
}

interface Destynacja {
    idDestynacja: number;
    nazwa: string;
}

interface Props {
    onClose: () => void;
    onSuccess: () => void;
}

const DodajZdjeciaModal: React.FC<Props> = ({ onClose, onSuccess }) => {
    const { showToast } = useNotification();
    const [osrodki, setOsrodki] = useState<Osrodek[]>([]);
    const [destynacje, setDestynacje] = useState<Destynacja[]>([]);
    const [loading, setLoading] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const [opisy, setOpisy] = useState<string[]>([]);
    const [formData, setFormData] = useState({
        idOsrodek: '',
        idDestynacja: '',
        tagi: '',
        czyGlowne: false
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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const selectedFiles = Array.from(e.target.files);
            setFiles(selectedFiles);
            // Inicjalizuj tablicę opisów
            setOpisy(new Array(selectedFiles.length).fill(''));
        }
    };

    const handleOpisChange = (index: number, value: string) => {
        const newOpisy = [...opisy];
        newOpisy[index] = value;
        setOpisy(newOpisy);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (files.length === 0) {
            showToast('Wybierz przynajmniej jedno zdjęcie.', 'warning');
            return;
        }

        setLoading(true);

        try {
            const formDataToSend = new FormData();

            // Dodaj pliki
            files.forEach(file => {
                formDataToSend.append('Pliki', file);
            });

            // Dodaj opisy (oddzielone |)
            const opisyString = opisy.join('|');
            formDataToSend.append('Opisy', opisyString);

            // Dodaj pozostałe dane
            if (formData.idOsrodek) {
                formDataToSend.append('IdOsrodek', formData.idOsrodek);
            }
            if (formData.idDestynacja) {
                formDataToSend.append('IdDestynacja', formData.idDestynacja);
            }
            if (formData.tagi) {
                formDataToSend.append('Tagi', formData.tagi);
            }
            formDataToSend.append('CzyGlowne', formData.czyGlowne.toString());

            await apiClient.post('/api/Zdjecia/upload-multiple', formDataToSend, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            showToast(`Pomyślnie dodano ${files.length} zdjęć.`, 'success');
            onSuccess();
        } catch (err: any) {
            showToast(err.response?.data?.message || 'Błąd podczas dodawania zdjęć.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <h2>Dodaj zdjęcia</h2>

                    <div className={styles.formGroup}>
                        <label>Pliki zdjęć *</label>
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleFileChange}
                            className={styles.fileInput}
                            required
                        />
                        {files.length > 0 && (
                            <p className={styles.fileCount}>Wybrano: {files.length} plik(ów)</p>
                        )}
                    </div>

                    {files.length > 0 && (
                        <div className={styles.opisySection}>
                            <h3>Opisy zdjęć</h3>
                            <p className={styles.hint}>Możesz dodać indywidualny opis dla każdego zdjęcia:</p>
                            {files.map((file, index) => (
                                <div key={index} className={styles.opisItem}>
                                    <label>{file.name}</label>
                                    <input
                                        type="text"
                                        placeholder="Opis zdjęcia (opcjonalnie)"
                                        value={opisy[index] || ''}
                                        onChange={(e) => handleOpisChange(index, e.target.value)}
                                        className={styles.input}
                                    />
                                </div>
                            ))}
                        </div>
                    )}

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
                            <span>Ustaw pierwsze zdjęcie jako główne</span>
                        </label>
                    </div>

                    <div className={styles.buttonContainer}>
                        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                            Anuluj
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Dodawanie...' : 'Dodaj zdjęcia'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DodajZdjeciaModal;
