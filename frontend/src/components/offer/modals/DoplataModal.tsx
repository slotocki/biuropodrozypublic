// components/offer/modals/DoplataModal.tsx
import React, { useState } from 'react';
import apiClient from '@/api/apiClient';
import { useNotification } from '@/context/NotificationContext';
import styles from './OsrodekModal.module.css';

interface Doplata {
    idDoplata: number;
    nazwaDoplaty: string;
    kwotaDoplaty: number;
}

interface Props {
    doplata?: Doplata | null;
    idOsrodek: number;
    onClose: () => void;
    onSuccess: () => void;
}

const DoplataModal: React.FC<Props> = ({ doplata, idOsrodek, onClose, onSuccess }) => {
    const { showToast } = useNotification();
    const [loading, setLoading] = useState(false);
    const isEditMode = !!doplata;

    const [formData, setFormData] = useState({
        nazwaDoplaty: doplata?.nazwaDoplaty || '',
        kwotaDoplaty: doplata?.kwotaDoplaty?.toString() || ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setLoading(true);

        try {
            const dataToSend = {
                nazwaDoplaty: formData.nazwaDoplaty,
                kwotaDoplaty: parseFloat(formData.kwotaDoplaty),
                idOsrodek: idOsrodek
            };

            if (isEditMode) {
                await apiClient.put(`/api/Doplata/${doplata.idDoplata}`, dataToSend);
                showToast('Dopłata zaktualizowana pomyślnie.', 'success');
            } else {
                await apiClient.post('/api/Doplata', dataToSend);
                showToast('Dopłata dodana pomyślnie.', 'success');
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
                    <h2>{isEditMode ? 'Edytuj dopłatę' : 'Dodaj dopłatę'}</h2>

                    <div className={styles.formGroup}>
                        <label>Nazwa dopłaty *</label>
                        <input
                            type="text"
                            value={formData.nazwaDoplaty}
                            onChange={(e) => setFormData({ ...formData, nazwaDoplaty: e.target.value })}
                            className={styles.input}
                            required
                            maxLength={150}
                            placeholder="np. Pokój 3-osobowy, Widok na morze"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Kwota dopłaty (zł) *</label>
                        <input
                            type="number"
                            step="0.01"
                            value={formData.kwotaDoplaty}
                            onChange={(e) => setFormData({ ...formData, kwotaDoplaty: e.target.value })}
                            className={styles.input}
                            required
                            placeholder="np. -200.00 lub +300.00"
                        />
                        <small style={{ color: '#a0aec0', fontSize: '0.85rem' }}>
                            Użyj wartości ujemnej dla zniżki (np. -200) lub dodatniej dla dopłaty (np. +300)
                        </small>
                    </div>

                    <div className={styles.buttonContainer}>
                        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                            Anuluj
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? (isEditMode ? 'Zapisywanie...' : 'Dodawanie...') : (isEditMode ? 'Zapisz zmiany' : 'Dodaj dopłatę')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DoplataModal;
