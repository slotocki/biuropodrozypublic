import React, { useState, useEffect } from 'react';
import apiClient from '@/common/api/apiClient';
import { useNotification } from '@/common/context/NotificationContext';
import '@/common/styles/PageStyles.css';
import baseStyles from '@/common/styles/KontrahentForm.module.css';
import customStyles from './KlientForm.module.css';
import type { Klient, Obywatelstwo, PostalCodeResult, Grupa, LocationOption } from '@/common/types';



interface KlientFormProps {
    klientToEdit: Klient | null;
    onSave: (klient: Klient) => void;
    onCancel: () => void;
}

const KlientForm: React.FC<KlientFormProps> = ({ klientToEdit, onSave, onCancel }) => {
    const { showToast } = useNotification();
    const styles = { ...baseStyles, ...customStyles };

    const [formData, setFormData] = useState<Omit<Klient, 'idKlient'>>({
        imie: '',
        nazwisko: '',
        ulica: '',
        kodPocztowy: '',
        miejscowosc: '',
        email: '',
        telefon: '',
        idObywatelstwo: 1,
        dataUrodzenia: '',
        adnotacje: '',
        idGrupa: undefined
    });

    const [obywatelstwa, setObywatelstwa] = useState<Obywatelstwo[]>([]);
    const [grupy, setGrupy] = useState<Grupa[]>([]);
    const [loadingPostalCode, setLoadingPostalCode] = useState(false);
    const [postalCodeTimeout, setPostalCodeTimeout] = useState<NodeJS.Timeout | null>(null);
    const [showGrupaSearch, setShowGrupaSearch] = useState(false);
    const [grupaSearchTerm, setGrupaSearchTerm] = useState('');
    const [selectedGrupaNazwa, setSelectedGrupaNazwa] = useState('');
    const [isYearOnly, setIsYearOnly] = useState(false);
    const [birthYear, setBirthYear] = useState('');
    const [availableLocations, setAvailableLocations] = useState<LocationOption[]>([]);

    useEffect(() => {
        const fetchObywatelstwa = async () => {
            try {
                const response = await apiClient.get('/api/klienci/obywatelstwa');
                setObywatelstwa(response.data);
            } catch (error) {
                console.error('Błąd podczas pobierania obywatelstw:', error);
            }
        };

        const fetchGrupy = async () => {
            try {
                const response = await apiClient.get('/api/grupy');
                setGrupy(response.data);
            } catch (error) {
                console.error('Błąd podczas pobierania grup:', error);
            }
        };

        fetchObywatelstwa();
        fetchGrupy();
    }, []);

    useEffect(() => {
        if (klientToEdit) {
            setFormData({
                imie: klientToEdit.imie,
                nazwisko: klientToEdit.nazwisko,
                ulica: klientToEdit.ulica || '',
                kodPocztowy: klientToEdit.kodPocztowy || '',
                miejscowosc: klientToEdit.miejscowosc || '',
                email: klientToEdit.email || '',
                telefon: klientToEdit.telefon || '',
                idObywatelstwo: klientToEdit.idObywatelstwo || 1,
                dataUrodzenia: klientToEdit.dataUrodzenia || '',
                adnotacje: klientToEdit.adnotacje || '',
                idGrupa: klientToEdit.idGrupa
            });

            if (klientToEdit.dataUrodzenia) {
                const dateParts = klientToEdit.dataUrodzenia.split('-');
                if (dateParts.length === 3 && dateParts[1] === '01' && dateParts[2] === '01') {
                    setIsYearOnly(true);
                    setBirthYear(dateParts[0]);
                }
            }

            if (klientToEdit.nazwaGrupy) {
                setSelectedGrupaNazwa(klientToEdit.nazwaGrupy);
            }
        }
    }, [klientToEdit]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleKodPocztowyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value;
        value = value.replace(/[^0-9-]/g, '');

        if (value.length === 2 && !value.includes('-')) {
            value = value + '-';
        } else if (value.length > 6) {
            value = value.substring(0, 6);
        }

        setFormData(prev => ({ ...prev, kodPocztowy: value }));

        if (value.length < 6) {
            setAvailableLocations([]);
        }

        if (postalCodeTimeout) {
            clearTimeout(postalCodeTimeout);
        }

        if (value.length === 6 && value.includes('-')) {
            const timeout = setTimeout(() => {
                fetchLocationByPostalCode(value);
            }, 500);

            setPostalCodeTimeout(timeout);
        }
    };

    const fetchLocationByPostalCode = async (kodPocztowy: string) => {
        setLoadingPostalCode(true);
        try {
            const response = await apiClient.post<PostalCodeResult>('/api/klienci/lookup-postal-code', {
                kodPocztowy
            });

            const result = response.data;

            if (result.success && result.locations && result.locations.length > 0) {
                setAvailableLocations(result.locations);
                setFormData(prev => ({
                    ...prev,
                    miejscowosc: result.locations[0].miejscowosc || ''
                }));

                if (result.locations.length > 1) {
                    showToast(`Znaleziono ${result.locations.length} miejscowości. Wybierz właściwą z listy.`, 'info');
                }
            } else {
                setAvailableLocations([]);
                showToast(result.message || 'Nie znaleziono miejscowości dla podanego kodu pocztowego.', 'warning');
            }
        } catch (error: any) {
            console.error('Błąd podczas pobierania miejscowości:', error);
            setAvailableLocations([]);
            showToast('Wystąpił błąd podczas pobierania danych z API kodów pocztowych.', 'error');
        } finally {
            setLoadingPostalCode(false);
        }
    };

    const handleRefreshLocation = () => {
        if (formData.kodPocztowy && formData.kodPocztowy.length === 6) {
            fetchLocationByPostalCode(formData.kodPocztowy);
        } else {
            showToast('Wpisz poprawny kod pocztowy w formacie XX-XXX.', 'warning');
        }
    };

    const handleMiejscowoscChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, miejscowosc: e.target.value }));
    };

    const handleSelectGrupa = (grupa: Grupa) => {
        setFormData(prev => ({ ...prev, idGrupa: grupa.idGrupa }));
        setSelectedGrupaNazwa(grupa.nazwaGrupy);
        setShowGrupaSearch(false);
        setGrupaSearchTerm('');
    };

    const handleRemoveGrupa = () => {
        setFormData(prev => ({ ...prev, idGrupa: undefined }));
        setSelectedGrupaNazwa('');
    };

    const filteredGrupy = grupy.filter(g =>
        g.nazwaGrupy.toLowerCase().includes(grupaSearchTerm.toLowerCase())
    );

    const validateForm = (): boolean => {
        if (!formData.imie.trim()) {
            showToast('Imię jest wymagane.', 'warning');
            return false;
        }

        if (!formData.nazwisko.trim()) {
            showToast('Nazwisko jest wymagane.', 'warning');
            return false;
        }

        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            showToast('Podaj poprawny adres email.', 'warning');
            return false;
        }

        if (formData.telefon && !/^[\d\s\+\-\(\)]{9,}$/.test(formData.telefon)) {
            showToast('Podaj poprawny numer telefonu (minimum 9 cyfr).', 'warning');
            return false;
        }

        if (formData.kodPocztowy && !/^\d{2}-\d{3}$/.test(formData.kodPocztowy)) {
            showToast('Kod pocztowy musi mieć format XX-XXX.', 'warning');
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
            let savedKlient: Klient;

            const dataToSend = {
                ...formData,
                idObywatelstwo: formData.idObywatelstwo || null,
                idGrupa: formData.idGrupa || null
            };

            if (klientToEdit?.idKlient) {
                await apiClient.put(`/api/klienci/${klientToEdit.idKlient}`, {
                    ...dataToSend,
                    idKlient: klientToEdit.idKlient
                });
                savedKlient = { ...dataToSend, idKlient: klientToEdit.idKlient } as Klient;
            } else {
                const response = await apiClient.post('/api/klienci', dataToSend);
                savedKlient = response.data;
            }

            onSave(savedKlient);
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Wystąpił błąd podczas zapisywania klienta.';
            showToast(errorMessage, 'error');
            console.error(error);
        }
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <form onSubmit={handleSubmit} className={styles.form}>
                    <h2>{klientToEdit ? 'Edytuj klienta' : 'Dodaj nowego klienta'}</h2>

                    {/* ROW 1: Imię i Nazwisko */}
                    <div className={styles.gridRow}>
                        <div className={styles.gridCell}>
                            <label className={styles.label} htmlFor="imie">
                                Imię <span className={styles.required}>*</span>
                            </label>
                            <input
                                id="imie"
                                name="imie"
                                className={styles.input}
                                type="text"
                                placeholder="Imię"
                                value={formData.imie}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className={styles.gridCell}>
                            <label className={styles.label} htmlFor="nazwisko">
                                Nazwisko <span className={styles.required}>*</span>
                            </label>
                            <input
                                id="nazwisko"
                                name="nazwisko"
                                className={styles.input}
                                type="text"
                                placeholder="Nazwisko"
                                value={formData.nazwisko}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    {/* ROW 2: Ulica (pełna szerokość) */}
                    <div className={styles.formGroup}>
                        <label className={styles.label} htmlFor="ulica">
                            Ulica i numer
                        </label>
                        <input
                            id="ulica"
                            name="ulica"
                            className={styles.input}
                            type="text"
                            placeholder="np. ul. Główna 15"
                            value={formData.ulica}
                            onChange={handleChange}
                        />
                    </div>

                    {/* ROW 3: Kod pocztowy i Miejscowość */}
                    <div className={styles.gridRow}>
                        <div className={styles.gridCell}>
                            <label className={styles.label}>
                                Kod pocztowy
                            </label>
                            <div className={styles.inputWithButton}>
                                <input
                                    id="kodPocztowy"
                                    name="kodPocztowy"
                                    className={styles.input}
                                    type="text"
                                    placeholder="XX-XXX"
                                    value={formData.kodPocztowy}
                                    onChange={handleKodPocztowyChange}
                                    maxLength={6}
                                />
                                <button
                                    type="button"
                                    className="btn btn-secondary btn-sm"
                                    onClick={handleRefreshLocation}
                                    disabled={loadingPostalCode}
                                    title="Odśwież miejscowość"
                                >
                                    {loadingPostalCode ? '⏳' : '🔄'}
                                </button>
                            </div>
                        </div>

                        <div className={styles.gridCell}>
                            <label className={styles.label} htmlFor="miejscowosc">
                                Miejscowość
                            </label>
                            {availableLocations.length > 1 ? (
                                <select
                                    id="miejscowosc"
                                    name="miejscowosc"
                                    className={styles.input}
                                    value={formData.miejscowosc}
                                    onChange={handleMiejscowoscChange}
                                >
                                    {availableLocations.map((location, index) => (
                                        <option key={index} value={location.miejscowosc}>
                                            {location.miejscowosc}
                                            {location.gmina && ` (gm. ${location.gmina})`}
                                            {location.powiat && ` [${location.powiat}]`}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    id="miejscowosc"
                                    name="miejscowosc"
                                    className={styles.input}
                                    type="text"
                                    placeholder="Miejscowość"
                                    value={formData.miejscowosc}
                                    onChange={handleMiejscowoscChange}
                                />
                            )}
                        </div>
                    </div>

                    {/* ROW 4: Telefon i Email */}
                    <div className={styles.gridRow}>
                        <div className={styles.gridCell}>
                            <label className={styles.label} htmlFor="telefon">
                                Telefon
                            </label>
                            <input
                                id="telefon"
                                name="telefon"
                                className={styles.input}
                                type="tel"
                                placeholder="123456789"
                                value={formData.telefon}
                                onChange={handleChange}
                            />
                        </div>
                        <div className={styles.gridCell}>
                            <label className={styles.label} htmlFor="email">
                                Email
                            </label>
                            <input
                                id="email"
                                name="email"
                                className={styles.input}
                                type="email"
                                placeholder="jan@example.com"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* ROW 5: Obywatelstwo i Grupa */}
                    <div className={styles.gridRow}>
                        <div className={styles.gridCell}>
                            <label className={styles.label} htmlFor="idObywatelstwo">
                                Obywatelstwo
                            </label>
                            <select
                                id="idObywatelstwo"
                                name="idObywatelstwo"
                                className={styles.input}
                                value={formData.idObywatelstwo || ''}
                                onChange={handleChange}
                            >
                                <option value="">-- Wybierz obywatelstwo --</option>
                                {obywatelstwa.map(o => (
                                    <option key={o.idObywatelstwo} value={o.idObywatelstwo}>
                                        {o.nazwa}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.gridCell}>
                            <label className={styles.label}>
                                Grupa
                            </label>

                            {selectedGrupaNazwa ? (
                                <div className={styles.selectedGrupaItem}>
                                    <span>👥 {selectedGrupaNazwa}</span>
                                    <button
                                        type="button"
                                        className={styles.removeGrupaButton}
                                        onClick={handleRemoveGrupa}
                                    >
                                        ✕
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    style={{ width: '100%' }}
                                    onClick={() => setShowGrupaSearch(true)}
                                >
                                    ➕ Dodaj do grupy
                                </button>
                            )}
                        </div>
                    </div>

                    {/* ROW 6: Data urodzenia (pełna szerokość) */}
                    <div className={styles.formGroup}>
                        <label className={styles.label}>
                            Data urodzenia
                        </label>
                        <div className={styles.dateInputGroup}>
                            <div className={styles.dateTypeSelector}>
                                <button
                                    type="button"
                                    className={`${styles.dateTypeButton} ${!isYearOnly ? styles.active : ''}`}
                                    onClick={() => {
                                        setIsYearOnly(false);
                                        if (birthYear) {
                                            setFormData(prev => ({ ...prev, dataUrodzenia: '' }));
                                            setBirthYear('');
                                        }
                                    }}
                                >
                                    Pełna data
                                </button>
                                <button
                                    type="button"
                                    className={`${styles.dateTypeButton} ${isYearOnly ? styles.active : ''}`}
                                    onClick={() => {
                                        setIsYearOnly(true);
                                        if (formData.dataUrodzenia) {
                                            const year = formData.dataUrodzenia.split('-')[0];
                                            setBirthYear(year);
                                            setFormData(prev => ({ ...prev, dataUrodzenia: `${year}-01-01` }));
                                        }
                                    }}
                                >
                                    Tylko rok
                                </button>
                            </div>

                            {isYearOnly ? (
                                <input
                                    id="birthYear"
                                    name="birthYear"
                                    className={`${styles.input} ${styles.dateInput}`}
                                    type="number"
                                    placeholder="np. 1990"
                                    min="1900"
                                    max={new Date().getFullYear()}
                                    value={birthYear}
                                    onChange={(e) => {
                                        const year = e.target.value;
                                        setBirthYear(year);
                                        if (year.length === 4) {
                                            setFormData(prev => ({ ...prev, dataUrodzenia: `${year}-01-01` }));
                                        }
                                    }}
                                />
                            ) : (
                                <input
                                    id="dataUrodzenia"
                                    name="dataUrodzenia"
                                    className={`${styles.input} ${styles.dateInput}`}
                                    type="date"
                                    value={formData.dataUrodzenia}
                                    onChange={handleChange}
                                />
                            )}
                        </div>
                    </div>

                    {showGrupaSearch && (
                        <div className={styles.grupaModalOverlay} onClick={() => setShowGrupaSearch(false)}>
                            <div className={styles.grupaModalContent} onClick={(e) => e.stopPropagation()}>
                                <div className={styles.grupaSearchHeader}>
                                    <h4>Wybierz grupę</h4>
                                    <button
                                        type="button"
                                        className={styles.closeGrupaSearch}
                                        onClick={() => {
                                            setShowGrupaSearch(false);
                                            setGrupaSearchTerm('');
                                        }}
                                    >
                                        ✕
                                    </button>
                                </div>
                                <input
                                    type="text"
                                    className={styles.grupaSearchInput}
                                    placeholder="Wyszukaj grupę..."
                                    value={grupaSearchTerm}
                                    onChange={(e) => setGrupaSearchTerm(e.target.value)}
                                    autoFocus
                                />
                                <div className={styles.grupaList}>
                                    {filteredGrupy.length === 0 ? (
                                        <p className={styles.noResults}>Nie znaleziono grup</p>
                                    ) : (
                                        filteredGrupy.map(grupa => (
                                            <div
                                                key={grupa.idGrupa}
                                                className={styles.grupaItem}
                                                onClick={() => handleSelectGrupa(grupa)}
                                            >
                                                <span className={styles.grupaIcon}>👥</span>
                                                <div className={styles.grupaInfo}>
                                                    <div className={styles.grupaNazwa}>{grupa.nazwaGrupy}</div>
                                                    {grupa.opiekunGrupy && (
                                                        <div className={styles.grupaOpiekun}>
                                                            Opiekun: {grupa.opiekunGrupy}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ROW 7: Adnotacje */}
                    <div className={styles.formGroup}>
                        <label className={styles.label} htmlFor="adnotacje">
                            Adnotacje
                        </label>
                        <textarea
                            id="adnotacje"
                            name="adnotacje"
                            className={styles.textarea}
                            rows={3}
                            placeholder="Wpisz dodatkowe informacje o kliencie..."
                            value={formData.adnotacje}
                            onChange={handleChange}
                        />


                    </div>

                    {/* Przyciski */}
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

export default KlientForm;
