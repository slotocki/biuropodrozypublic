import React, { useState, useEffect } from 'react';
import apiClient from '@/api/apiClient';
import { useNotification } from '@/context/NotificationContext';
import styles from '@/components/KontrahentForm.module.css';
import '@/pages/PageStyles.css';
import type { Grupa } from '@/types';

interface GrupaFormProps {
    grupaToEdit: Grupa | null;
    onSave: (grupa: Grupa) => void;
    onCancel: () => void;
}

const GrupaForm: React.FC<GrupaFormProps> = ({ grupaToEdit, onSave, onCancel }) => {
    const { showToast } = useNotification();
    const [formData, setFormData] = useState<Omit<Grupa, 'idGrupa'>>({
        nazwaGrupy: '',
        opiekunGrupy: '',
        telefonOpiekuna: '',
        adnotacje: ''
    });

    useEffect(() => {
        if (grupaToEdit) {
            setFormData({
                nazwaGrupy: grupaToEdit.nazwaGrupy,
                opiekunGrupy: grupaToEdit.opiekunGrupy || '',
                telefonOpiekuna: grupaToEdit.telefonOpiekuna || '',
                adnotacje: grupaToEdit.adnotacje || ''
            });
        }
    }, [grupaToEdit]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const validateForm = (): boolean => {
        if (!formData.nazwaGrupy.trim()) {
            showToast('Nazwa grupy jest wymagana.', 'warning');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            let savedGrupa: Grupa;

            if (grupaToEdit?.idGrupa) {
                await apiClient.put(`/api/grupy/${grupaToEdit.idGrupa}`, {
                    ...formData,
                    idGrupa: grupaToEdit.idGrupa
                });
                savedGrupa = { ...formData, idGrupa: grupaToEdit.idGrupa } as Grupa;
            } else {
                const response = await apiClient.post('/api/grupy', formData);
                savedGrupa = response.data;
            }

            onSave(savedGrupa);
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Wystąpił błąd podczas zapisywania grupy.';
            showToast(errorMessage, 'error');
            console.error(error);
        }
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <form onSubmit={handleSubmit} className={styles.form}>
                    <h2>{grupaToEdit ? 'Edytuj grupę' : 'Dodaj nową grupę'}</h2>

                    <div className={styles.formGroup}>
                        <label className={styles.label} htmlFor="nazwaGrupy">
                            Nazwa grupy <span className={styles.required}>*</span>
                        </label>
                        <input
                            id="nazwaGrupy"
                            name="nazwaGrupy"
                            className={styles.input}
                            type="text"
                            value={formData.nazwaGrupy}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label} htmlFor="opiekunGrupy">
                            Osoba kontaktowa / Opiekun grupy
                        </label>
                        <input
                            id="opiekunGrupy"
                            name="opiekunGrupy"
                            className={styles.input}
                            type="text"
                            value={formData.opiekunGrupy}
                            onChange={handleChange}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label} htmlFor="telefonOpiekuna">
                            Telefon opiekuna
                        </label>
                        <input
                            id="telefonOpiekuna"
                            name="telefonOpiekuna"
                            className={styles.input}
                            type="tel"
                            value={formData.telefonOpiekuna}
                            onChange={handleChange}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label} htmlFor="adnotacje">
                            Adnotacje
                        </label>
                        <textarea
                            id="adnotacje"
                            name="adnotacje"
                            className={styles.textarea}
                            rows={3}
                            value={formData.adnotacje}
                            onChange={handleChange}
                        />
                    </div>

                    <div className={styles.buttonContainer}>
                        <button type="button" className="btn btn-secondary" onClick={onCancel}>
                            Anuluj
                        </button>
                        <button type="submit" className="btn btn-primary">
                            Zapisz
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default GrupaForm;
