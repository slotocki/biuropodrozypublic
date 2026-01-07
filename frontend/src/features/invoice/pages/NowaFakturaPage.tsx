import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/common/api/apiClient';
import { useNotification } from '@/common/context/NotificationContext';
import styles from './FakturaForm.module.css';
import '@/common/styles/PageStyles.css';
import UslugaForm from '@/features/invoice/components/form/UslugaForm';
import WybierzUslugeModal from '@/features/invoice/components/modals/WybierzUslugeModal';
import WybierzKontrahentaModal from '@/features/invoice/components/modals/WybierzKontrahentaModal';
import KontrahentForm from '@/features/invoice/components/form/KontrahentForm';
import type { Kontrahent, Usluga, PozycjaFaktury } from '@/common/types';

const NowaFakturaPage = () => {
    const navigate = useNavigate();
    const { showToast } = useNotification();

    const [numerFaktury, setNumerFaktury] = useState('Ładowanie...');
    const [dataWystawienia, setDataWystawienia] = useState(new Date().toISOString().split('T')[0]);
    const [terminPlatnosci, setTerminPlatnosci] = useState('');
    const [formaPlatnosci, setFormaPlatnosci] = useState('przelew 7 dni');
    const [selectedKontrahent, setSelectedKontrahent] = useState<Kontrahent | null>(null);
    const [pozycje, setPozycje] = useState<PozycjaFaktury[]>([]);
    const [zaplacono, setZaplacono] = useState<string>('');

    const [kontrahenci, setKontrahenci] = useState<Kontrahent[]>([]);
    const [uslugi, setUslugi] = useState<Usluga[]>([]);
    const [isUslugaFormVisible, setIsUslugaFormVisible] = useState(false);
    const [isWybierzUslugeVisible, setIsWybierzUslugeVisible] = useState(false);
    const [isWybierzKontrahentaVisible, setIsWybierzKontrahentaVisible] = useState(false);
    const [isKontrahentFormVisible, setIsKontrahentFormVisible] = useState(false);

    const fetchInitialData = useCallback(async () => {
        try {
            const [kontrahenciRes, uslugiRes, numerRes] = await Promise.all([
                apiClient.get('/api/kontrahenci'),
                apiClient.get('/api/uslugi'),
                apiClient.get('/api/fakturyvat/next-number')
            ]);
            setKontrahenci(kontrahenciRes.data);
            setUslugi(uslugiRes.data);
            setNumerFaktury(numerRes.data.numerFaktury);
        } catch (error) {
            console.error("Błąd podczas pobierania danych początkowych", error);
            showToast("Nie udało się załadować danych kontrahentów i usług", "error");
        }
    }, [showToast]);

    useEffect(() => {
        const today = new Date();
        const futureDate = new Date(today);
        futureDate.setDate(today.getDate() + 7);
        setTerminPlatnosci(futureDate.toISOString().split('T')[0]);

        fetchInitialData();
    }, [fetchInitialData]);

    const calculatePaymentDeadline = (baseDate: string, paymentForm: string): string => {
        const date = new Date(baseDate);
        let daysToAdd = 7;

        if (paymentForm.includes('3 dni')) {
            daysToAdd = 3;
        } else if (paymentForm.includes('7 dni')) {
            daysToAdd = 7;
        } else if (paymentForm.includes('14 dni')) {
            daysToAdd = 14;
        } else if (paymentForm === 'karta' || paymentForm === 'gotówka') {
            daysToAdd = 0;
        }

        date.setDate(date.getDate() + daysToAdd);
        return date.toISOString().split('T')[0];
    };

    const handleSelectKontrahent = (kontrahent: Kontrahent) => {
        setSelectedKontrahent(kontrahent);
        setIsWybierzKontrahentaVisible(false);
    };

    const handleAddNewKontrahent = () => {
        setIsWybierzKontrahentaVisible(false);
        setIsKontrahentFormVisible(true);
    };

    const handleFormaPlatnosciChange = (nowaForma: string) => {
        setFormaPlatnosci(nowaForma);
        const nowyTermin = calculatePaymentDeadline(dataWystawienia, nowaForma);
        setTerminPlatnosci(nowyTermin);
    };

    const handleDataWystawieniaChange = (nowaData: string) => {
        setDataWystawienia(nowaData);
        const nowyTermin = calculatePaymentDeadline(nowaData, formaPlatnosci);
        setTerminPlatnosci(nowyTermin);
    };

    const handleSaveKontrahent = async (nowyKontrahent: Kontrahent) => {
        setIsKontrahentFormVisible(false);
        setSelectedKontrahent(nowyKontrahent);
        fetchInitialData();
    };

    const handleSelectUsluga = (usluga: Usluga) => {
        setPozycje([...pozycje, {
            klucz: Date.now(),
            idUsluga: usluga.idUsluga,
            nazwaUslugi: usluga.nazwaUslugi,
            ilosc: 1,
            cenaNetto: usluga.cenaNetto,
            stawkaVat: usluga.stawkaVat
        }]);
        setIsWybierzUslugeVisible(false);
    };

    const handleSaveNowaUsluga = (nowaUsluga: Usluga) => {
        setUslugi([...uslugi, nowaUsluga]);
        setPozycje([...pozycje, {
            klucz: Date.now(),
            idUsluga: nowaUsluga.idUsluga,
            nazwaUslugi: nowaUsluga.nazwaUslugi,
            ilosc: 1,
            cenaNetto: nowaUsluga.cenaNetto,
            stawkaVat: nowaUsluga.stawkaVat
        }]);
        setIsUslugaFormVisible(false);
    };

    const usunPozycje = (klucz: number) => {
        setPozycje(pozycje.filter(p => p.klucz !== klucz));
    };

    const handlePozycjaChange = (klucz: number, field: keyof PozycjaFaktury, value: any) => {
        const nowePozycje = pozycje.map(p => {
            if (p.klucz === klucz) {
                const zaktualizowanaPozycja = { ...p, [field]: value };
                if (field === 'idUsluga') {
                    const wybranaUsluga = uslugi.find(u => u.idUsluga === Number(value));
                    if(wybranaUsluga) {
                        zaktualizowanaPozycja.nazwaUslugi = wybranaUsluga.nazwaUslugi;
                        zaktualizowanaPozycja.cenaNetto = wybranaUsluga.cenaNetto;
                        zaktualizowanaPozycja.stawkaVat = wybranaUsluga.stawkaVat;
                    }
                }
                return zaktualizowanaPozycja;
            }
            return p;
        });
        setPozycje(nowePozycje);
    };

    const podsumowanie = useMemo(() => {
        const sumaNetto = pozycje.reduce((sum, p) => sum + (p.cenaNetto * p.ilosc), 0);
        const sumaVat = pozycje.reduce((sum, p) => sum + (p.cenaNetto * p.ilosc * (p.stawkaVat / 100)), 0);
        const sumaBrutto = sumaNetto + sumaVat;
        const zaplaconoValue = parseFloat(zaplacono) || 0;
        const pozostalo = sumaBrutto - zaplaconoValue;
        return { sumaNetto, sumaVat, sumaBrutto, pozostalo };
    }, [pozycje, zaplacono]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedKontrahent) {
            showToast("Wybierz kontrahenta", "warning");
            return;
        }

        const zaplaconoValue = parseFloat(zaplacono) || 0;

        const fakturaDoWyslania = {
            idKontrahent: selectedKontrahent.idKontrahent,
            numerFaktury,
            dataWystawienia,
            terminPlatnosci,
            formaPlatnosci,
            zaplacono: zaplaconoValue,
            pozycje: pozycje.map(p => ({
                idUsluga: p.idUsluga,
                ilosc: p.ilosc,
                cenaNetto: p.cenaNetto,
                stawkaVat: p.stawkaVat,
            })),
        };

        try {
            await apiClient.post('/api/fakturyvat', fakturaDoWyslania);
            showToast('Faktura została pomyślnie wystawiona!', 'success');
            navigate('/faktury/lista');
        } catch (error) {
            showToast('Wystąpił błąd podczas wystawiania faktury', 'error');
            console.error(error);
        }
    };

    return (
        <div className="page-container">
            {isUslugaFormVisible && <UslugaForm onSave={handleSaveNowaUsluga} onCancel={() => setIsUslugaFormVisible(false)} />}
            {isWybierzUslugeVisible && <WybierzUslugeModal uslugi={uslugi} onSelect={handleSelectUsluga} onCancel={() => setIsWybierzUslugeVisible(false)} />}
            {isWybierzKontrahentaVisible && <WybierzKontrahentaModal kontrahenci={kontrahenci} onSelect={handleSelectKontrahent} onCancel={() => setIsWybierzKontrahentaVisible(false)} onAddNew={handleAddNewKontrahent} />}
            {isKontrahentFormVisible && <KontrahentForm kontrahentToEdit={null} onSave={handleSaveKontrahent} onCancel={() => setIsKontrahentFormVisible(false)} />}

            <header className="page-header"><h1>Nowa Faktura VAT</h1></header>
            <form onSubmit={handleSubmit} className={styles.formContainer}>
                <div className={styles.formSection}>
                    <h3>Dane faktury</h3>
                    <div className={styles.grid}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Numer faktury</label>
                            <input className={styles.input} type="text" value={numerFaktury} onChange={e => setNumerFaktury(e.target.value)} />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Data wystawienia</label>
                            <input className={styles.input} type="date" value={dataWystawienia} onChange={e => handleDataWystawieniaChange(e.target.value)} />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Termin płatności</label>
                            <input className={styles.input} type="date" value={terminPlatnosci} onChange={e => setTerminPlatnosci(e.target.value)} />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Forma płatności</label>
                            <select className={styles.select} value={formaPlatnosci} onChange={e => handleFormaPlatnosciChange(e.target.value)}>
                                <option value="przelew 3 dni">przelew 3 dni</option>
                                <option value="przelew 7 dni">przelew 7 dni</option>
                                <option value="przelew 14 dni">przelew 14 dni</option>
                                <option value="karta">karta</option>
                                <option value="gotówka">gotówka</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className={styles.formSection}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        <h3>Nabywca</h3>
                        <button type="button" className="btn btn-secondary" onClick={() => setIsWybierzKontrahentaVisible(true)}>
                            {selectedKontrahent ? 'Zmień kontrahenta' : 'Wybierz kontrahenta'}
                        </button>
                    </div>
                    {selectedKontrahent ? (
                        <div className={styles.selectedEntity}>
                            <strong>{selectedKontrahent.nazwaFirmy}</strong>
                            <p>NIP: {selectedKontrahent.nip}</p>
                            <p>{selectedKontrahent.ulica}, {selectedKontrahent.kodPocztowy} {selectedKontrahent.miejscowosc}</p>
                        </div>
                    ) : (
                        <p style={{marginTop: '1rem'}}>Nie wybrano kontrahenta.</p>
                    )}
                </div>

                <div className={styles.formSection}>
                    <h3>Pozycje na fakturze</h3>
                    <table className={styles.positionsTable}>
                        <thead>
                        <tr>
                            <th>Usługa</th>
                            <th>Ilość</th>
                            <th>Cena netto</th>
                            <th>Stawka VAT (%)</th>
                            <th>Wartość netto</th>
                            <th>Wartość brutto</th>
                            <th>Akcje</th>
                        </tr>
                        </thead>
                        <tbody>
                        {pozycje.map((p) => (
                            <tr key={p.klucz}>
                                <td>{p.nazwaUslugi}</td>
                                <td><input className={styles.input} type="number" value={p.ilosc} onChange={e => handlePozycjaChange(p.klucz, 'ilosc', Number(e.target.value))} /></td>
                                <td><input className={styles.input} type="number" step="0.01" value={p.cenaNetto} onChange={e => handlePozycjaChange(p.klucz, 'cenaNetto', Number(e.target.value))} /></td>
                                <td><input className={styles.input} type="number" value={p.stawkaVat} onChange={e => handlePozycjaChange(p.klucz, 'stawkaVat', Number(e.target.value))} /></td>
                                <td>{(p.ilosc * p.cenaNetto).toFixed(2)}</td>
                                <td>{(p.ilosc * p.cenaNetto * (1 + p.stawkaVat / 100)).toFixed(2)}</td>
                                <td><button type="button" className="btn btn-danger" onClick={() => usunPozycje(p.klucz)}>Usuń</button></td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    <div style={{marginTop: '1rem', display: 'flex', gap: '1rem'}}>
                        <button type="button" className="btn btn-secondary" onClick={() => setIsWybierzUslugeVisible(true)}>Wczytaj usługę</button>
                        <button type="button" className="btn btn-primary" onClick={() => setIsUslugaFormVisible(true)}>Dodaj nową usługę</button>
                    </div>
                </div>

                <div className={styles.summary}>
                    <table className={styles.summaryTable}>
                        <tbody>
                        <tr>
                            <td>Suma netto:</td>
                            <td>{podsumowanie.sumaNetto.toFixed(2)} zł</td>
                        </tr>
                        <tr>
                            <td>Suma VAT:</td>
                            <td>{podsumowanie.sumaVat.toFixed(2)} zł</td>
                        </tr>
                        <tr>
                            <td><strong>Suma brutto:</strong></td>
                            <td><strong>{podsumowanie.sumaBrutto.toFixed(2)} zł</strong></td>
                        </tr>
                        <tr>
                            <td>Zapłacono:</td>
                            <td>
                                <input
                                    type="number"
                                    step="0.01"
                                    className={styles.input}
                                    value={zaplacono}
                                    onChange={e => setZaplacono(e.target.value)}
                                    placeholder="0.00"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td><strong>Pozostało do zapłaty:</strong></td>
                            <td><strong>{podsumowanie.pozostalo.toFixed(2)} zł</strong></td>
                        </tr>
                        </tbody>
                    </table>
                </div>

                <div className={styles.actions}>
                    <button type="submit" className="btn btn-primary">Wygeneruj fakturę</button>
                </div>
            </form>
        </div>
    );
};

export default NowaFakturaPage;