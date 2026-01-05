import React, { useState, useEffect } from 'react';
import apiClient from '@/common/api/apiClient';
import { useNotification } from '@/common/context/NotificationContext';
import styles from '@/common/styles/KontrahentForm.module.css';
import '@/common/styles/PageStyles.css';
import type { Kontrahent } from '@/common/types';




interface KontrahentFormProps {
    kontrahentToEdit: Kontrahent | null;
    onSave: (kontrahent: Kontrahent) => void;
    onCancel: () => void;
}

const KontrahentForm: React.FC<KontrahentFormProps> = ({ kontrahentToEdit, onSave, onCancel }) => {
    const { showToast } = useNotification();
    const [formData, setFormData] = useState<Omit<Kontrahent, 'idKontrahent'>>({
        nazwaFirmy: '', nip: '', ulica: '', kodPocztowy: '', miejscowosc: '', email: '', numerTelefonu: ''
    });

    useEffect(() => {
        if (kontrahentToEdit) {
            setFormData(kontrahentToEdit);
        }
    }, [kontrahentToEdit]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFetchFromCeidg = async () => {
        if (!formData.nip) {
            showToast('Wpisz numer NIP.', 'warning');
            return;
        }
        try {
            const response = await apiClient.get(`/api/kontrahenci/ceidg/${formData.nip}`);

            const firma = response.data;

            if (!firma || !firma.nip) {
                showToast('Nie znaleziono firmy o podanym numerze NIP.', 'error');
                return;
            }

            setFormData(prev => ({
                ...prev,
                nazwaFirmy: firma.nazwa || '',
                ulica: firma.ulica || '',
                kodPocztowy: firma.kodPocztowy || '',
                miejscowosc: firma.miejscowosc || '',
                email: firma.email || '',
                numerTelefonu: firma.telefon || '',
            }));

            showToast('Dane pobrane z CEIDG pomyślnie.', 'success');
        } catch (error: any) {
            if (error.response?.status === 404) {
                showToast('Nie znaleziono firmy o podanym numerze NIP.', 'error');
            } else {
                showToast('Wystąpił błąd podczas pobierania danych z CEIDG.', 'error');
            }
            console.error('Błąd CEIDG:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            let savedKontrahent: Kontrahent;

            if (kontrahentToEdit?.idKontrahent) {
                await apiClient.put(`/api/kontrahenci/${kontrahentToEdit.idKontrahent}`, formData);
                savedKontrahent = { ...formData, idKontrahent: kontrahentToEdit.idKontrahent };
            } else {
                const response = await apiClient.post('/api/kontrahenci', formData);
                savedKontrahent = response.data;
            }

            onSave(savedKontrahent);
        } catch (error) {
            showToast('Wystąpił błąd podczas zapisywania kontrahenta.', 'error');
            console.error(error);
        }
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <form onSubmit={handleSubmit} className={styles.form}>
                    <h2>{kontrahentToEdit ? 'Edytuj kontrahenta' : 'Dodaj nowego kontrahenta'}</h2>

                    <div className={styles.nipGroup}>
                        <div className={styles.formGroup}>
                            <label className={styles.label} htmlFor="nip">NIP</label>
                            <input id="nip" name="nip" className={styles.input} type="text" value={formData.nip || ''} onChange={handleChange} />
                        </div>
                        <button type="button" className="btn btn-secondary" onClick={handleFetchFromCeidg}>Wczytaj z CEIDG</button>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label} htmlFor="nazwaFirmy">Nazwa firmy</label>
                        <input id="nazwaFirmy" name="nazwaFirmy" className={styles.input} type="text" value={formData.nazwaFirmy} onChange={handleChange} required />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label} htmlFor="ulica">Ulica i numer</label>
                        <input id="ulica" name="ulica" className={styles.input} type="text" value={formData.ulica || ''} onChange={handleChange} />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label} htmlFor="kodPocztowy">Kod pocztowy</label>
                        <input id="kodPocztowy" name="kodPocztowy" className={styles.input} type="text" value={formData.kodPocztowy || ''} onChange={handleChange} />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label} htmlFor="miejscowosc">Miejscowość</label>
                        <input id="miejscowosc" name="miejscowosc" className={styles.input} type="text" value={formData.miejscowosc || ''} onChange={handleChange} />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label} htmlFor="email">Email</label>
                        <input id="email" name="email" className={styles.input} type="email" value={formData.email || ''} onChange={handleChange} />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label} htmlFor="numerTelefonu">Telefon</label>
                        <input id="numerTelefonu" name="numerTelefonu" className={styles.input} type="tel" value={formData.numerTelefonu || ''} onChange={handleChange} />
                    </div>

                    <div className={styles.buttonContainer}>
                        <button type="button" className="btn btn-secondary" onClick={onCancel}>Anuluj</button>
                        <button type="submit" className="btn btn-primary">Zapisz</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default KontrahentForm;
