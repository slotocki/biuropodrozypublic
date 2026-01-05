// components/offer/modals/PromocjaModal.tsx
import React, { useState } from 'react';
import apiClient from '@/common/api/apiClient';
import { useNotification } from '@/common/context/NotificationContext';
import styles from './PromocjaModal.module.css';

interface Promocja {
    idPromocja: number;
    nazwaPromocji: string;
    opis?: string;
    dataOd: string;
    dataDo: string;
    kwotaZnizki?: number;
    procentZnizki?: number;
}

interface Props {
    promocja?: Promocja | null;  // null = dodawanie, obiekt = edycja
    onClose: () => void;
    onSuccess: () => void;
}

const PromocjaModal: React.FC<Props> = ({ promocja, onClose, onSuccess }) => {
    const { showToast } = useNotification();
    const [loading, setLoading] = useState(false);
    const isEditMode = !!promocja;

    const [formData, setFormData] = useState({
        nazwaPromocji: promocja?.nazwaPromocji || '',
        opis: promocja?.opis || '',
        dataOd: promocja?.dataOd.split('T')[0] || '',
        dataDo: promocja?.dataDo.split('T')[0] || '',
        kwotaZnizki: promocja?.kwotaZnizki?.toString() || '',
        procentZnizki: promocja?.procentZnizki?.toString() || ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.kwotaZnizki && !formData.procentZnizki) {
            showToast('Podaj kwotę lub procent zniżki.', 'warning');
            return;
        }

        if (formData.dataOd >= formData.dataDo) {
            showToast('Data zakończenia musi być późniejsza niż data rozpoczęcia.', 'warning');
            return;
        }

        setLoading(true);

        try {
            const dataToSend = {
                nazwaPromocji: formData.nazwaPromocji,
                opis: formData.opis || null,
                dataOd: formData.dataOd,
                dataDo: formData.dataDo,
                kwotaZnizki: formData.kwotaZnizki ? parseFloat(formData.kwotaZnizki) : null,
                procentZnizki: formData.procentZnizki ? parseFloat(formData.procentZnizki) : null
            };

            if (isEditMode) {
                await apiClient.put(`/api/Promocja/${promocja.idPromocja}`, dataToSend);
                showToast('Promocja zaktualizowana pomyślnie.', 'success');
            } else {
                await apiClient.post('/api/Promocja', dataToSend);
                showToast('Promocja dodana pomyślnie.', 'success');
            }

            onSuccess();
        } catch (err: any) {
            showToast(err.response?.data?.message || `Błąd podczas ${isEditMode ? 'aktualizacji' : 'dodawania'}.`, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <h2>{isEditMode ? 'Edytuj promocję' : 'Dodaj promocję'}</h2>

                    <div className={styles.formGroup}>
                        <label>Nazwa promocji *</label>
                        <input
                            type="text"
                            value={formData.nazwaPromocji}
                            onChange={(e) => setFormData({ ...formData, nazwaPromocji: e.target.value })}
                            className={styles.input}
                            required
                            maxLength={150}
                            placeholder="np. Wczesna rezerwacja 2025"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Opis</label>
                        <textarea
                            value={formData.opis}
                            onChange={(e) => setFormData({ ...formData, opis: e.target.value })}
                            className={styles.textarea}
                            rows={3}
                            placeholder="Opcjonalny opis promocji"
                        />
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>Data od *</label>
                            <input
                                type="date"
                                value={formData.dataOd}
                                onChange={(e) => setFormData({ ...formData, dataOd: e.target.value })}
                                className={styles.input}
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Data do *</label>
                            <input
                                type="date"
                                value={formData.dataDo}
                                onChange={(e) => setFormData({ ...formData, dataDo: e.target.value })}
                                className={styles.input}
                                required
                            />
                        </div>
                    </div>

                    <div className={styles.znizkaInfo}>
                        ℹ️ Podaj <strong>kwotę</strong> lub <strong>procent</strong> zniżki (lub oba)
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>Kwota zniżki (zł)</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.kwotaZnizki}
                                onChange={(e) => setFormData({ ...formData, kwotaZnizki: e.target.value })}
                                className={styles.input}
                                placeholder="np. 50.00"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Procent zniżki (%)</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                value={formData.procentZnizki}
                                onChange={(e) => setFormData({ ...formData, procentZnizki: e.target.value })}
                                className={styles.input}
                                placeholder="np. 15.00"
                            />
                        </div>
                    </div>

                    <div className={styles.buttonContainer}>
                        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                            Anuluj
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? (isEditMode ? 'Zapisywanie...' : 'Dodawanie...') : (isEditMode ? 'Zapisz zmiany' : 'Dodaj promocję')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PromocjaModal;
