
import React, { useState } from 'react';
import apiClient from '@/common/api/apiClient';
import { useNotification } from '@/common/context/NotificationContext';
import styles from './UslugaForm.module.css';
import '@/common/styles/PageStyles.css';

interface Usluga {
    idUsluga: number;
    nazwaUslugi: string;
    cenaNetto: number;
    stawkaVat: number;
}

interface UslugaFormProps {
    onSave: (nowaUsluga: Usluga) => void;
    onCancel: () => void;
}

const UslugaForm: React.FC<UslugaFormProps> = ({ onSave, onCancel }) => {
    const { showToast } = useNotification();
    const [nazwaUslugi, setNazwaUslugi] = useState('');
    const [cenaNetto, setCenaNetto] = useState('');
    const [cenaBrutto, setCenaBrutto] = useState('');
    const [stawkaVat, setStawkaVat] = useState('23');

    const handleNettoChange = (nettoValue: string) => {
        setCenaNetto(nettoValue);

        // Jeśli pole jest puste, wyczyść brutto
        if (!nettoValue || nettoValue === '') {
            setCenaBrutto('');
            return;
        }

        const netto = parseFloat(nettoValue);
        if (!isNaN(netto)) {
            const vat = parseFloat(stawkaVat) || 0;
            const brutto = netto * (1 + vat / 100);
            setCenaBrutto(brutto.toFixed(2));
        }
    };

    const handleBruttoChange = (bruttoValue: string) => {
        setCenaBrutto(bruttoValue);

        // Jeśli pole jest puste, wyczyść netto
        if (!bruttoValue || bruttoValue === '') {
            setCenaNetto('');
            return;
        }

        const brutto = parseFloat(bruttoValue);
        if (!isNaN(brutto)) {
            const vat = parseFloat(stawkaVat) || 0;
            const netto = brutto / (1 + vat / 100);
            setCenaNetto(netto.toFixed(2));
        }
    };

    const handleVatChange = (vatValue: string) => {
        setStawkaVat(vatValue);

        // Jeśli jest ustawione netto, przelicz brutto
        if (cenaNetto && cenaNetto !== '') {
            const netto = parseFloat(cenaNetto);
            const vat = parseFloat(vatValue) || 0;
            if (!isNaN(netto)) {
                const brutto = netto * (1 + vat / 100);
                setCenaBrutto(brutto.toFixed(2));
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Walidacja
        if (!cenaNetto || cenaNetto === '') {
            showToast('Podaj cenę netto', 'warning');
            return;
        }

        const nowaUsluga = {
            nazwaUslugi,
            cenaNetto: parseFloat(cenaNetto),
            stawkaVat: parseInt(stawkaVat) || 23
        };

        try {
            const response = await apiClient.post('/api/uslugi', nowaUsluga);
            showToast('Usługa dodana pomyślnie', 'success');
            onSave(response.data);
        } catch (error) {
            showToast('Nie udało się dodać nowej usługi', 'error');
            console.error(error);
        }
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <form onSubmit={handleSubmit} className={styles.form}>
                    <h3>Dodaj nową usługę</h3>

                    <div className={styles.formGroup}>
                        <label className={styles.label} htmlFor="nazwaUslugi">Nazwa usługi</label>
                        <input
                            id="nazwaUslugi"
                            className={styles.input}
                            type="text"
                            value={nazwaUslugi}
                            onChange={e => setNazwaUslugi(e.target.value)}
                            placeholder="np. Wycieczka do Zakopanego"
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label} htmlFor="stawkaVat">Stawka VAT (%)</label>
                        <input
                            id="stawkaVat"
                            className={styles.input}
                            type="number"
                            value={stawkaVat}
                            onChange={e => handleVatChange(e.target.value)}
                            placeholder="23"
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label} htmlFor="cenaNetto">Cena netto</label>
                        <input
                            id="cenaNetto"
                            className={styles.input}
                            type="number"
                            step="0.01"
                            value={cenaNetto}
                            onChange={e => handleNettoChange(e.target.value)}
                            placeholder="0.00"
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label} htmlFor="cenaBrutto">Cena brutto</label>
                        <input
                            id="cenaBrutto"
                            className={styles.input}
                            type="number"
                            step="0.01"
                            value={cenaBrutto}
                            onChange={e => handleBruttoChange(e.target.value)}
                            placeholder="0.00"
                        />
                        <small style={{ color: '#a0aec0', fontSize: '0.85rem' }}>
                            Uzupełni się automatycznie po wpisaniu ceny netto
                        </small>
                    </div>

                    <div className={styles.buttonContainer}>
                        <button type="button" className="btn btn-secondary" onClick={onCancel}>
                            Anuluj
                        </button>
                        <button type="submit" className="btn btn-primary">
                            Dodaj i użyj
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UslugaForm;