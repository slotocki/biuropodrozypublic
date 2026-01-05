// components/offer/modals/PokojModal.tsx
import React, { useState, useEffect } from 'react';
import apiClient from '@/common/api/apiClient';
import { useNotification } from '@/common/context/NotificationContext';
import styles from './OsrodekModal.module.css';

interface Pokoj {
    idPokoj: number;
    idRodzajPokoju: number;
    numerPokoju?: string;
    opisPokoju?: string;
    iloscLozek: number;
    iloscOsob: number;
    maxIloscOsob: number;
}

interface PokojRodzaj {
    idRodzajPokoju: number;
    rodzajPokoju: string;
}

interface Props {
    pokoj?: Pokoj | null;
    idOsrodek: number;
    onClose: () => void;
    onSuccess: () => void;
}

const PokojModal: React.FC<Props> = ({ pokoj, idOsrodek, onClose, onSuccess }) => {
    const { showToast } = useNotification();
    const [loading, setLoading] = useState(false);
    const [rodzaje, setRodzaje] = useState<PokojRodzaj[]>([]);
    const isEditMode = !!pokoj;

    const [formData, setFormData] = useState({
        numerPokoju: pokoj?.numerPokoju || '',
        opisPokoju: pokoj?.opisPokoju || '',
        idRodzajPokoju: pokoj?.idRodzajPokoju || '',
        iloscLozek: pokoj?.iloscLozek?.toString() || '',
        iloscOsob: pokoj?.iloscOsob?.toString() || '',
        maxIloscOsob: pokoj?.maxIloscOsob?.toString() || ''
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

        setLoading(true);

        try {
            const dataToSend = {
                idOsrodek: idOsrodek,
                idRodzajPokoju: parseInt(formData.idRodzajPokoju as any),
                numerPokoju: formData.numerPokoju || null,
                opisPokoju: formData.opisPokoju || null,
                iloscLozek: parseInt(formData.iloscLozek),
                iloscOsob: parseInt(formData.iloscOsob),
                maxIloscOsob: parseInt(formData.maxIloscOsob)
            };

            if (isEditMode) {
                await apiClient.put(`/api/Pokoj/${pokoj.idPokoj}`, dataToSend);
                showToast('Pokój zaktualizowany pomyślnie.', 'success');
            } else {
                await apiClient.post('/api/Pokoj', dataToSend);
                showToast('Pokój dodany pomyślnie.', 'success');
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
                    <h2>{isEditMode ? 'Edytuj pokój' : 'Dodaj pokój'}</h2>

                    <div className={styles.formGroup}>
                        <label>Numer pokoju</label>
                        <input
                            type="text"
                            value={formData.numerPokoju}
                            onChange={(e) => setFormData({ ...formData, numerPokoju: e.target.value })}
                            className={styles.input}
                            maxLength={50}
                            placeholder="np. 101, A-201 (opcjonalne)"
                        />
                        <small style={{ color: '#a0aec0', fontSize: '0.85rem' }}>
                            Pozostaw puste jeśli numer nie jest znany
                        </small>
                    </div>

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
                        <label>Opis pokoju</label>
                        <input
                            type="text"
                            value={formData.opisPokoju}
                            onChange={(e) => setFormData({ ...formData, opisPokoju: e.target.value })}
                            className={styles.input}
                            maxLength={255}
                            placeholder="np. Widok na morze, przy śmietniku"
                        />
                        <small style={{ color: '#a0aec0', fontSize: '0.85rem' }}>
                            Dodatkowe informacje o pokoju
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
                            />
                        </div>
                    </div>

                    <div className={styles.buttonContainer}>
                        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                            Anuluj
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? (isEditMode ? 'Zapisywanie...' : 'Dodawanie...') : (isEditMode ? 'Zapisz zmiany' : 'Dodaj pokój')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PokojModal;
