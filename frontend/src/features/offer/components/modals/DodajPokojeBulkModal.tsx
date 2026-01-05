// components/offer/modals/DodajPokojeBulkModal.tsx
import React, { useState, useEffect } from 'react';
import apiClient from '@/common/api/apiClient';
import { useNotification } from '@/common/context/NotificationContext';
import styles from './OsrodekModal.module.css';
interface PokojRodzaj {
    idRodzajPokoju: number;
    rodzajPokoju: string;
}

interface Props {
    idOsrodek: number;
    onClose: () => void;
    onSuccess: () => void;
}

const DodajPokojeBulkModal: React.FC<Props> = ({ idOsrodek, onClose, onSuccess }) => {
    const { showToast } = useNotification();
    const [loading, setLoading] = useState(false);
    const [rodzaje, setRodzaje] = useState<PokojRodzaj[]>([]);

    const [formData, setFormData] = useState({
        idRodzajPokoju: '',
        liczbaPokoi: '1',
        opisPokoju: '',
        iloscLozek: '',
        iloscOsob: '',
        maxIloscOsob: ''
    });

    useEffect(() => {
        const fetchRodzaje = async () => {
            try {
                const response = await apiClient.get('/api/SimpleDictionary/pokoje-rodzaj');
                setRodzaje(response.data);
            } catch (err) {
                showToast('Błąd pobierania rodzajów pokoi.', 'error');
            }
        };
        fetchRodzaje();
    }, [showToast]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.idRodzajPokoju) {
            showToast('Wybierz rodzaj pokoju.', 'warning');
            return;
        }

        if (!formData.iloscLozek || !formData.iloscOsob || !formData.maxIloscOsob) {
            showToast('Wypełnij wszystkie wymagane pola.', 'warning');
            return;
        }

        const liczbaPokoi = parseInt(formData.liczbaPokoi);
        if (liczbaPokoi < 1 || liczbaPokoi > 500) {
            showToast('Liczba pokoi musi być między 1 a 500.', 'warning');
            return;
        }

        setLoading(true);

        try {
            const dataToSend = {
                idOsrodek: idOsrodek,
                idRodzajPokoju: parseInt(formData.idRodzajPokoju),
                liczbaPokoi: liczbaPokoi,
                opisPokoju: formData.opisPokoju || null,
                iloscLozek: parseInt(formData.iloscLozek),
                iloscOsob: parseInt(formData.iloscOsob),
                maxIloscOsob: parseInt(formData.maxIloscOsob)
            };

            await apiClient.post('/api/Pokoj/bulk', dataToSend);
            showToast(`Dodano ${liczbaPokoi} pokoi pomyślnie.`, 'success');
            onSuccess();
        } catch (err: any) {
            showToast(err.response?.data?.message || 'Błąd podczas dodawania pokoi.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <h2>Dodaj grupę pokoi</h2>

                    <div className={styles.formGroup}>
                        <label>Rodzaj pokoju *</label>
                        <select
                            value={formData.idRodzajPokoju}
                            onChange={(e) => setFormData({ ...formData, idRodzajPokoju: e.target.value })}
                            className={styles.input}
                            required
                        >
                            <option value="">Wybierz rodzaj pokoju</option>
                            {rodzaje.map(r => (
                                <option key={r.idRodzajPokoju} value={r.idRodzajPokoju}>
                                    {r.rodzajPokoju}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Liczba pokoi *</label>
                        <input
                            type="number"
                            min="1"
                            max="500"
                            value={formData.liczbaPokoi}
                            onChange={(e) => setFormData({ ...formData, liczbaPokoi: e.target.value })}
                            className={styles.input}
                            required
                            placeholder="np. 20"
                        />
                        <small style={{ color: '#a0aec0', fontSize: '0.85rem' }}>
                            Maksymalnie 500 pokoi naraz
                        </small>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Opis pokoju</label>
                        <input
                            type="text"
                            value={formData.opisPokoju}
                            onChange={(e) => setFormData({ ...formData, opisPokoju: e.target.value })}
                            className={styles.input}
                            maxLength={255}
                            placeholder="np. Widok na morze (opcjonalne)"
                        />
                        <small style={{ color: '#a0aec0', fontSize: '0.85rem' }}>
                            Ten sam opis będzie dla wszystkich pokoi w grupie
                        </small>
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>Ilość łóżek *</label>
                            <input
                                type="number"
                                min="1"
                                max="10"
                                value={formData.iloscLozek}
                                onChange={(e) => setFormData({ ...formData, iloscLozek: e.target.value })}
                                className={styles.input}
                                required
                                placeholder="np. 2"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Ilość osób *</label>
                            <input
                                type="number"
                                min="1"
                                max="10"
                                value={formData.iloscOsob}
                                onChange={(e) => setFormData({ ...formData, iloscOsob: e.target.value })}
                                className={styles.input}
                                required
                                placeholder="np. 2"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Max osób *</label>
                            <input
                                type="number"
                                min="1"
                                max="10"
                                value={formData.maxIloscOsob}
                                onChange={(e) => setFormData({ ...formData, maxIloscOsob: e.target.value })}
                                className={styles.input}
                                required
                                placeholder="np. 3"
                            />
                        </div>
                    </div>

                    <div style={{
                        backgroundColor: '#2c5282',
                        padding: '1rem',
                        borderRadius: '6px',
                        marginBottom: '1.5rem',
                        borderLeft: '4px solid #4299e1'
                    }}>
                        <p style={{ margin: 0, color: '#e2e8f0', fontSize: '0.9rem' }}>
                            ℹ️ Zostanie utworzonych <strong>{formData.liczbaPokoi}</strong> pokoi typu{' '}
                            <strong>{rodzaje.find(r => r.idRodzajPokoju.toString() === formData.idRodzajPokoju)?.rodzajPokoju || '...'}</strong>
                            {formData.iloscLozek && formData.iloscOsob && (
                                <> z <strong>{formData.iloscLozek}</strong> łóżkami i <strong>{formData.iloscOsob}</strong> osobami</>
                            )}
                        </p>
                    </div>

                    <div className={styles.buttonContainer}>
                        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                            Anuluj
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Dodawanie...' : `Dodaj ${formData.liczbaPokoi} pokoi`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DodajPokojeBulkModal;
