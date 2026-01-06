import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '@/common/api/apiClient';
import { useNotification } from '@/common/context/NotificationContext';
import styles from './FakturaForm.module.css';
import '@/common/styles/PageStyles.css';
import UslugaForm from '@/features/invoice/components/form/UslugaForm';
import WybierzUslugeModal from '@/features/invoice/components/modals/WybierzUslugeModal';
import type { Kontrahent, Usluga, PozycjaFaktury } from '@/common/types';

interface OryginalnaFaktura {
    idFaktura: number;
    numerFaktury: string;
    dataWystawienia: string;
    kwotaNetto: number;
    kwotaVat: number;
    kwotaBrutto: number;
}

interface PozycjaOryginalna {
    idUsluga: number;
    nazwaUslugi: string;
    ilosc: number;
    cenaNetto: number;
    stawkaVat: number;
    wartoscNetto: number;
    wartoscBrutto: number;
}

const KorektaFakturaPage = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { showToast } = useNotification();

    const [loading, setLoading] = useState(true);
    const [oryginalnaFaktura, setOryginalnaFaktura] = useState<OryginalnaFaktura | null>(null);
    const [kontrahent, setKontrahent] = useState<Kontrahent | null>(null);
    const [pozycjeOryginalne, setPozycjeOryginalne] = useState<PozycjaOryginalna[]>([]);
    
    const [dataWystawienia, setDataWystawienia] = useState(new Date().toISOString().split('T')[0]);
    const [terminPlatnosci, setTerminPlatnosci] = useState('');
    const [formaPlatnosci, setFormaPlatnosci] = useState('przelew 7 dni');
    const [powodKorekty, setPowodKorekty] = useState('');
    const [pozycjeKorekty, setPozycjeKorekty] = useState<PozycjaFaktury[]>([]);
    const [zaplacono, setZaplacono] = useState<string>('0');

    const [uslugi, setUslugi] = useState<Usluga[]>([]);
    const [isUslugaFormVisible, setIsUslugaFormVisible] = useState(false);
    const [isWybierzUslugeVisible, setIsWybierzUslugeVisible] = useState(false);

    // Załaduj dane faktury do korekty
    useEffect(() => {
        const loadFaktura = async () => {
            if (!id) {
                showToast('Brak ID faktury', 'error');
                navigate('/faktury/lista');
                return;
            }

            try {
                setLoading(true);
                const response = await apiClient.get(`/api/fakturyvat/${id}/korekta`);
                const data = response.data;

                setOryginalnaFaktura(data.oryginalnaFaktura);
                setKontrahent(data.kontrahent);
                setPozycjeOryginalne(data.pozycjeOryginalne);

                // Automatycznie dodaj pozycje stornujące (ujemne)
                const pozycjeStorno: PozycjaFaktury[] = data.pozycjeOryginalne.map((p: PozycjaOryginalna, index: number) => ({
                    klucz: Date.now() + index,
                    idUsluga: p.idUsluga,
                    nazwaUslugi: `STORNO: ${p.nazwaUslugi}`,
                    ilosc: -p.ilosc, // Ujemna ilość
                    cenaNetto: p.cenaNetto,
                    stawkaVat: p.stawkaVat
                }));

                setPozycjeKorekty(pozycjeStorno);
                setLoading(false);
            } catch (error: any) {
                const errorMsg = error.response?.data?.message || 'Błąd podczas ładowania faktury do korekty';
                showToast(errorMsg, 'error');
                console.error(error);
                navigate('/faktury/lista');
            }
        };

        loadFaktura();
    }, [id, navigate, showToast]);

    // Pobierz usługi
    const fetchUslugi = useCallback(async () => {
        try {
            const response = await apiClient.get('/api/uslugi');
            setUslugi(response.data);
        } catch (error) {
            console.error("Błąd podczas pobierania usług", error);
        }
    }, []);

    useEffect(() => {
        fetchUslugi();
        
        // Ustaw termin płatności
        const today = new Date();
        const futureDate = new Date(today);
        futureDate.setDate(today.getDate() + 7);
        setTerminPlatnosci(futureDate.toISOString().split('T')[0]);
    }, [fetchUslugi]);

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

    const handleSelectUsluga = (usluga: Usluga) => {
        setPozycjeKorekty([...pozycjeKorekty, {
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
        setPozycjeKorekty([...pozycjeKorekty, {
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
        setPozycjeKorekty(pozycjeKorekty.filter(p => p.klucz !== klucz));
    };

    const handlePozycjaChange = (klucz: number, field: keyof PozycjaFaktury, value: any) => {
        const nowePozycje = pozycjeKorekty.map(p => {
            if (p.klucz === klucz) {
                const zaktualizowanaPozycja = { ...p, [field]: value };
                if (field === 'idUsluga') {
                    const wybranaUsluga = uslugi.find(u => u.idUsluga === Number(value));
                    if (wybranaUsluga) {
                        zaktualizowanaPozycja.nazwaUslugi = wybranaUsluga.nazwaUslugi;
                        zaktualizowanaPozycja.cenaNetto = wybranaUsluga.cenaNetto;
                        zaktualizowanaPozycja.stawkaVat = wybranaUsluga.stawkaVat;
                    }
                }
                return zaktualizowanaPozycja;
            }
            return p;
        });
        setPozycjeKorekty(nowePozycje);
    };

    // Obliczanie podsumowania - obsługa wartości ujemnych
    const podsumowanie = useMemo(() => {
        const sumaNetto = pozycjeKorekty.reduce((sum, p) => sum + (p.cenaNetto * p.ilosc), 0);
        const sumaVat = pozycjeKorekty.reduce((sum, p) => sum + (p.cenaNetto * p.ilosc * (p.stawkaVat / 100)), 0);
        const sumaBrutto = sumaNetto + sumaVat;
        const zaplaconoValue = parseFloat(zaplacono) || 0;
        const doZwrotuLubDoplaty = sumaBrutto - zaplaconoValue;
        return { sumaNetto, sumaVat, sumaBrutto, doZwrotuLubDoplaty };
    }, [pozycjeKorekty, zaplacono]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!powodKorekty.trim()) {
            showToast("Podaj powód korekty", "warning");
            return;
        }

        if (pozycjeKorekty.length === 0) {
            showToast("Dodaj przynajmniej jedną pozycję", "warning");
            return;
        }

        const zaplaconoValue = parseFloat(zaplacono) || 0;

        const korektaDoWyslania = {
            dataWystawienia,
            terminPlatnosci,
            formaPlatnosci,
            zaplacono: zaplaconoValue,
            powodKorekty,
            pozycje: pozycjeKorekty.map(p => ({
                idUsluga: p.idUsluga,
                ilosc: p.ilosc,
                cenaNetto: p.cenaNetto,
                stawkaVat: p.stawkaVat,
            })),
        };

        try {
            const response = await apiClient.post(`/api/fakturyvat/${id}/korekta`, korektaDoWyslania);
            showToast(`Faktura korygująca ${response.data.numerFaktury} została wystawiona!`, 'success');
            navigate('/faktury/lista');
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || 'Wystąpił błąd podczas tworzenia korekty';
            showToast(errorMsg, 'error');
            console.error(error);
        }
    };

    if (loading) {
        return <p className="loading-text">Ładowanie danych faktury...</p>;
    }

    return (
        <div className="page-container">
            {isUslugaFormVisible && <UslugaForm onSave={handleSaveNowaUsluga} onCancel={() => setIsUslugaFormVisible(false)} />}
            {isWybierzUslugeVisible && <WybierzUslugeModal uslugi={uslugi} onSelect={handleSelectUsluga} onCancel={() => setIsWybierzUslugeVisible(false)} />}

            <header className="page-header">
                <h1 style={{ color: '#dc2626' }}>📝 FAKTURA KORYGUJĄCA</h1>
            </header>

            {/* Informacja o fakturze oryginalnej */}
            <div style={{ 
                backgroundColor: '#fef3c7', 
                padding: '1rem', 
                borderRadius: '8px', 
                marginBottom: '1.5rem',
                border: '1px solid #f59e0b'
            }}>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#92400e' }}>
                    Korekta do faktury: {oryginalnaFaktura?.numerFaktury}
                </h3>
                <p style={{ margin: 0, color: '#78350f' }}>
                    Data wystawienia oryginału: {oryginalnaFaktura?.dataWystawienia} | 
                    Kwota brutto oryginału: <strong>{oryginalnaFaktura?.kwotaBrutto.toFixed(2)} zł</strong>
                </p>
            </div>

            <form onSubmit={handleSubmit} className={styles.formContainer}>
                {/* Powód korekty */}
                <div className={styles.formSection} style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}>
                    <h3 style={{ color: '#dc2626' }}>⚠️ Powód korekty (wymagany)</h3>
                    <textarea
                        className={styles.input}
                        value={powodKorekty}
                        onChange={e => setPowodKorekty(e.target.value)}
                        placeholder="Opisz powód wystawienia korekty..."
                        rows={3}
                        required
                        style={{ width: '100%', resize: 'vertical' }}
                    />
                </div>

                <div className={styles.formSection}>
                    <h3>Dane korekty</h3>
                    <div className={styles.grid}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Data wystawienia korekty</label>
                            <input 
                                className={styles.input} 
                                type="date" 
                                value={dataWystawienia} 
                                onChange={e => handleDataWystawieniaChange(e.target.value)} 
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Termin płatności</label>
                            <input 
                                className={styles.input} 
                                type="date" 
                                value={terminPlatnosci} 
                                onChange={e => setTerminPlatnosci(e.target.value)} 
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Forma płatności</label>
                            <select 
                                className={styles.select} 
                                value={formaPlatnosci} 
                                onChange={e => handleFormaPlatnosciChange(e.target.value)}
                            >
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
                    <h3>Nabywca</h3>
                    {kontrahent ? (
                        <div className={styles.selectedEntity}>
                            <strong>{kontrahent.nazwaFirmy}</strong>
                            <p>NIP: {kontrahent.nip}</p>
                            <p>{kontrahent.ulica}, {kontrahent.kodPocztowy} {kontrahent.miejscowosc}</p>
                        </div>
                    ) : (
                        <p>Brak danych kontrahenta</p>
                    )}
                </div>

                {/* Tabela oryginalnych pozycji - tylko informacyjna */}
                <div className={styles.formSection} style={{ backgroundColor: '#f3f4f6' }}>
                    <h3>📋 Pozycje z faktury oryginalnej (informacyjnie)</h3>
                    <table className={styles.positionsTable}>
                        <thead>
                            <tr>
                                <th>Usługa</th>
                                <th>Ilość</th>
                                <th>Cena netto</th>
                                <th>Stawka VAT</th>
                                <th>Wartość netto</th>
                                <th>Wartość brutto</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pozycjeOryginalne.map((p, index) => (
                                <tr key={index}>
                                    <td>{p.nazwaUslugi}</td>
                                    <td>{p.ilosc}</td>
                                    <td>{p.cenaNetto.toFixed(2)} zł</td>
                                    <td>{p.stawkaVat}%</td>
                                    <td>{p.wartoscNetto.toFixed(2)} zł</td>
                                    <td>{p.wartoscBrutto.toFixed(2)} zł</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pozycje korekty - edytowalne */}
                <div className={styles.formSection}>
                    <h3 style={{ color: '#dc2626' }}>📝 Pozycje korekty (ujemne = storno, dodatnie = nowe)</h3>
                    <p style={{ fontSize: '0.9em', color: '#666', marginBottom: '1rem' }}>
                        System automatycznie dodał pozycje stornujące (ujemne). Możesz je edytować lub dodać nowe pozycje z poprawnymi wartościami.
                    </p>
                    <table className={styles.positionsTable}>
                        <thead>
                            <tr>
                                <th>Usługa</th>
                                <th>Ilość (ujemna = storno)</th>
                                <th>Cena netto</th>
                                <th>Stawka VAT (%)</th>
                                <th>Wartość netto</th>
                                <th>Wartość brutto</th>
                                <th>Akcje</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pozycjeKorekty.map((p) => {
                                const wartoscNetto = p.ilosc * p.cenaNetto;
                                const wartoscBrutto = wartoscNetto * (1 + p.stawkaVat / 100);
                                const isNegative = wartoscBrutto < 0;
                                
                                return (
                                    <tr key={p.klucz} style={{ backgroundColor: isNegative ? '#fef2f2' : '#f0fdf4' }}>
                                        <td>{p.nazwaUslugi}</td>
                                        <td>
                                            <input 
                                                className={styles.input} 
                                                type="number" 
                                                step="any"
                                                value={p.ilosc} 
                                                onChange={e => handlePozycjaChange(p.klucz, 'ilosc', Number(e.target.value))} 
                                                style={{ color: p.ilosc < 0 ? '#dc2626' : '#059669' }}
                                            />
                                        </td>
                                        <td>
                                            <input 
                                                className={styles.input} 
                                                type="number" 
                                                step="0.01" 
                                                value={p.cenaNetto} 
                                                onChange={e => handlePozycjaChange(p.klucz, 'cenaNetto', Number(e.target.value))} 
                                            />
                                        </td>
                                        <td>
                                            <input 
                                                className={styles.input} 
                                                type="number" 
                                                value={p.stawkaVat} 
                                                onChange={e => handlePozycjaChange(p.klucz, 'stawkaVat', Number(e.target.value))} 
                                            />
                                        </td>
                                        <td style={{ color: isNegative ? '#dc2626' : '#059669' }}>
                                            {wartoscNetto.toFixed(2)} zł
                                        </td>
                                        <td style={{ color: isNegative ? '#dc2626' : '#059669', fontWeight: 'bold' }}>
                                            {wartoscBrutto.toFixed(2)} zł
                                        </td>
                                        <td>
                                            <button 
                                                type="button" 
                                                className="btn btn-danger" 
                                                onClick={() => usunPozycje(p.klucz)}
                                            >
                                                Usuń
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => setIsWybierzUslugeVisible(true)}>
                            ➕ Dodaj pozycję z listy usług
                        </button>
                        <button type="button" className="btn btn-primary" onClick={() => setIsUslugaFormVisible(true)}>
                            ➕ Dodaj nową usługę
                        </button>
                    </div>
                </div>

                {/* Podsumowanie korekty */}
                <div className={styles.summary}>
                    <table className={styles.summaryTable}>
                        <tbody>
                            <tr>
                                <td>Suma netto korekty:</td>
                                <td style={{ color: podsumowanie.sumaNetto < 0 ? '#dc2626' : '#059669' }}>
                                    {podsumowanie.sumaNetto.toFixed(2)} zł
                                </td>
                            </tr>
                            <tr>
                                <td>Suma VAT korekty:</td>
                                <td style={{ color: podsumowanie.sumaVat < 0 ? '#dc2626' : '#059669' }}>
                                    {podsumowanie.sumaVat.toFixed(2)} zł
                                </td>
                            </tr>
                            <tr>
                                <td><strong>Suma brutto korekty:</strong></td>
                                <td style={{ 
                                    color: podsumowanie.sumaBrutto < 0 ? '#dc2626' : '#059669',
                                    fontWeight: 'bold',
                                    fontSize: '1.2em'
                                }}>
                                    {podsumowanie.sumaBrutto.toFixed(2)} zł
                                </td>
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
                                <td>
                                    <strong>
                                        {podsumowanie.doZwrotuLubDoplaty < 0 ? 'DO ZWROTU:' : 'DO DOPŁATY:'}
                                    </strong>
                                </td>
                                <td style={{ 
                                    color: podsumowanie.doZwrotuLubDoplaty < 0 ? '#dc2626' : '#059669',
                                    fontWeight: 'bold',
                                    fontSize: '1.2em'
                                }}>
                                    {Math.abs(podsumowanie.doZwrotuLubDoplaty).toFixed(2)} zł
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className={styles.actions}>
                    <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#dc2626' }}>
                        📝 Wystaw fakturę korygującą
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={() => navigate('/faktury/lista')}>
                        Anuluj
                    </button>
                </div>
            </form>
        </div>
    );
};

export default KorektaFakturaPage;

