import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '@/common/api/apiClient';
import { useNotification } from '@/common/context/NotificationContext';
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

    const cardStyle = {
        backgroundColor: '#2d3748',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
    };

    const inputStyle = {
        padding: '0.75rem 1rem',
        borderRadius: '8px',
        border: '1px solid #4a5568',
        backgroundColor: '#1a202c',
        color: '#fff',
        fontSize: '0.95rem',
        width: '100%'
    };

    const labelStyle = {
        color: '#a0aec0',
        fontSize: '0.9rem',
        marginBottom: '0.5rem',
        display: 'block'
    };

    return (
        <div className="page-container">
            {isUslugaFormVisible && <UslugaForm onSave={handleSaveNowaUsluga} onCancel={() => setIsUslugaFormVisible(false)} />}
            {isWybierzUslugeVisible && <WybierzUslugeModal uslugi={uslugi} onSelect={handleSelectUsluga} onCancel={() => setIsWybierzUslugeVisible(false)} />}

            {/* Przycisk powrotu */}
            <div style={{ marginBottom: '1rem' }}>
                <button 
                    className="btn btn-secondary" 
                    onClick={() => navigate('/faktury/lista')}
                    style={{ 
                        padding: '0.6rem 1.2rem',
                        borderRadius: '6px',
                        fontSize: '0.95rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    ← Lista faktur
                </button>
            </div>

            <header className="page-header">
                <h1 style={{ margin: 0, color: '#fc8181' }}>📝 Faktura Korygująca</h1>
            </header>

            {/* Informacja o fakturze oryginalnej */}
            <div style={{ 
                ...cardStyle,
                background: 'linear-gradient(135deg, #44337a 0%, #553c9a 100%)',
                border: '1px solid #805ad5'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>📄</span>
                    <h3 style={{ margin: 0, color: '#e9d8fd' }}>
                        Korekta do faktury: <span style={{ color: '#fff', fontWeight: 'bold' }}>{oryginalnaFaktura?.numerFaktury}</span>
                    </h3>
                </div>
                <div style={{ display: 'flex', gap: '2rem', color: '#d6bcfa', fontSize: '0.95rem' }}>
                    <span>📅 Data oryginału: <strong style={{ color: '#fff' }}>{oryginalnaFaktura?.dataWystawienia}</strong></span>
                    <span>💰 Brutto oryginału: <strong style={{ color: '#fff' }}>{oryginalnaFaktura?.kwotaBrutto.toFixed(2)} zł</strong></span>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                {/* Powód korekty */}
                <div style={{ 
                    ...cardStyle,
                    background: 'linear-gradient(135deg, #742a2a 0%, #9b2c2c 100%)',
                    border: '1px solid #fc8181'
                }}>
                    <h3 style={{ color: '#fed7d7', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        ⚠️ Powód korekty <span style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>(wymagany)</span>
                    </h3>
                    <textarea
                        value={powodKorekty}
                        onChange={e => setPowodKorekty(e.target.value)}
                        placeholder="Opisz powód wystawienia korekty..."
                        required
                        style={{ 
                            ...inputStyle,
                            resize: 'vertical',
                            minHeight: '80px'
                        }}
                    />
                </div>

                {/* Dane korekty i nabywca */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    {/* Dane korekty */}
                    <div style={cardStyle}>
                        <h3 style={{ color: '#e2e8f0', margin: '0 0 1.25rem 0' }}>📋 Dane korekty</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={labelStyle}>Data wystawienia korekty</label>
                                <input 
                                    type="date" 
                                    value={dataWystawienia} 
                                    onChange={e => handleDataWystawieniaChange(e.target.value)}
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Termin płatności</label>
                                <input 
                                    type="date" 
                                    value={terminPlatnosci} 
                                    onChange={e => setTerminPlatnosci(e.target.value)}
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Forma płatności</label>
                                <select 
                                    value={formaPlatnosci} 
                                    onChange={e => handleFormaPlatnosciChange(e.target.value)}
                                    style={{ ...inputStyle, cursor: 'pointer' }}
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

                    {/* Nabywca */}
                    <div style={cardStyle}>
                        <h3 style={{ color: '#e2e8f0', margin: '0 0 1.25rem 0' }}>👤 Nabywca</h3>
                        {kontrahent ? (
                            <div style={{ color: '#e2e8f0' }}>
                                <div style={{ 
                                    fontSize: '1.1rem', 
                                    fontWeight: 'bold', 
                                    marginBottom: '0.75rem',
                                    color: '#fff'
                                }}>
                                    {kontrahent.nazwaFirmy}
                                </div>
                                <div style={{ color: '#a0aec0', lineHeight: '1.6' }}>
                                    <div>NIP: {kontrahent.nip}</div>
                                    <div>{kontrahent.ulica}</div>
                                    <div>{kontrahent.kodPocztowy} {kontrahent.miejscowosc}</div>
                                </div>
                            </div>
                        ) : (
                            <p style={{ color: '#a0aec0' }}>Brak danych kontrahenta</p>
                        )}
                    </div>
                </div>

                {/* Pozycje z faktury oryginalnej */}
                <div style={{ ...cardStyle, backgroundColor: '#374151' }}>
                    <h3 style={{ color: '#9ca3af', margin: '0 0 1rem 0' }}>📋 Pozycje z faktury oryginalnej (informacyjnie)</h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #4b5563' }}>
                                    <th style={{ padding: '0.75rem', textAlign: 'left', color: '#9ca3af' }}>Usługa</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'right', color: '#9ca3af' }}>Ilość</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'right', color: '#9ca3af' }}>Cena netto</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'right', color: '#9ca3af' }}>VAT</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'right', color: '#9ca3af' }}>Netto</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'right', color: '#9ca3af' }}>Brutto</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pozycjeOryginalne.map((p, index) => (
                                    <tr key={index} style={{ borderBottom: '1px solid #4b5563' }}>
                                        <td style={{ padding: '0.75rem', color: '#d1d5db' }}>{p.nazwaUslugi}</td>
                                        <td style={{ padding: '0.75rem', textAlign: 'right', color: '#d1d5db' }}>{p.ilosc}</td>
                                        <td style={{ padding: '0.75rem', textAlign: 'right', color: '#d1d5db' }}>{p.cenaNetto.toFixed(2)} zł</td>
                                        <td style={{ padding: '0.75rem', textAlign: 'right', color: '#d1d5db' }}>{p.stawkaVat}%</td>
                                        <td style={{ padding: '0.75rem', textAlign: 'right', color: '#d1d5db' }}>{p.wartoscNetto.toFixed(2)} zł</td>
                                        <td style={{ padding: '0.75rem', textAlign: 'right', color: '#d1d5db', fontWeight: 'bold' }}>{p.wartoscBrutto.toFixed(2)} zł</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pozycje korekty */}
                <div style={cardStyle}>
                    <div style={{ marginBottom: '1rem' }}>
                        <h3 style={{ color: '#fc8181', margin: '0 0 0.5rem 0' }}>📝 Pozycje korekty</h3>
                        <p style={{ fontSize: '0.85rem', color: '#a0aec0', margin: 0 }}>
                            Ujemna ilość = storno (zwrot), dodatnia ilość = nowe pozycje. System automatycznie dodał pozycje stornujące.
                        </p>
                    </div>
                    
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #4a5568' }}>
                                    <th style={{ padding: '0.75rem', textAlign: 'left', color: '#a0aec0' }}>Usługa</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'center', color: '#a0aec0', width: '100px' }}>Ilość</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'center', color: '#a0aec0', width: '120px' }}>Cena netto</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'center', color: '#a0aec0', width: '80px' }}>VAT %</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'right', color: '#a0aec0' }}>Netto</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'right', color: '#a0aec0' }}>Brutto</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'center', color: '#a0aec0', width: '60px' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {pozycjeKorekty.map((p) => {
                                    const wartoscNetto = p.ilosc * p.cenaNetto;
                                    const wartoscBrutto = wartoscNetto * (1 + p.stawkaVat / 100);
                                    const isNegative = wartoscBrutto < 0;
                                    
                                    return (
                                        <tr 
                                            key={p.klucz} 
                                            style={{ 
                                                borderBottom: '1px solid #4a5568',
                                                backgroundColor: isNegative ? 'rgba(252, 129, 129, 0.1)' : 'rgba(104, 211, 145, 0.1)'
                                            }}
                                        >
                                            <td style={{ padding: '0.75rem', color: '#e2e8f0' }}>{p.nazwaUslugi}</td>
                                            <td style={{ padding: '0.5rem' }}>
                                                <input 
                                                    type="number" 
                                                    step="any"
                                                    value={p.ilosc} 
                                                    onChange={e => handlePozycjaChange(p.klucz, 'ilosc', Number(e.target.value))}
                                                    style={{ 
                                                        ...inputStyle, 
                                                        textAlign: 'center',
                                                        color: p.ilosc < 0 ? '#fc8181' : '#68d391',
                                                        fontWeight: 'bold'
                                                    }}
                                                />
                                            </td>
                                            <td style={{ padding: '0.5rem' }}>
                                                <input 
                                                    type="number" 
                                                    step="0.01" 
                                                    value={p.cenaNetto} 
                                                    onChange={e => handlePozycjaChange(p.klucz, 'cenaNetto', Number(e.target.value))}
                                                    style={{ ...inputStyle, textAlign: 'center' }}
                                                />
                                            </td>
                                            <td style={{ padding: '0.5rem' }}>
                                                <input 
                                                    type="number" 
                                                    value={p.stawkaVat} 
                                                    onChange={e => handlePozycjaChange(p.klucz, 'stawkaVat', Number(e.target.value))}
                                                    style={{ ...inputStyle, textAlign: 'center' }}
                                                />
                                            </td>
                                            <td style={{ 
                                                padding: '0.75rem', 
                                                textAlign: 'right', 
                                                color: isNegative ? '#fc8181' : '#68d391',
                                                fontVariantNumeric: 'tabular-nums'
                                            }}>
                                                {wartoscNetto.toFixed(2)} zł
                                            </td>
                                            <td style={{ 
                                                padding: '0.75rem', 
                                                textAlign: 'right', 
                                                color: isNegative ? '#fc8181' : '#68d391',
                                                fontWeight: 'bold',
                                                fontVariantNumeric: 'tabular-nums'
                                            }}>
                                                {wartoscBrutto.toFixed(2)} zł
                                            </td>
                                            <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                                                <button 
                                                    type="button"
                                                    onClick={() => usunPozycje(p.klucz)}
                                                    style={{
                                                        padding: '0.4rem 0.6rem',
                                                        borderRadius: '6px',
                                                        border: '2px solid transparent',
                                                        backgroundColor: '#e53e3e',
                                                        color: '#fff',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#fc8181'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.transform = 'scale(1)'; }}
                                                    title="Usuń pozycję"
                                                >
                                                    🗑️
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div style={{ marginTop: '1.25rem', display: 'flex', gap: '1rem' }}>
                        <button 
                            type="button" 
                            onClick={() => setIsWybierzUslugeVisible(true)}
                            style={{
                                padding: '0.6rem 1.2rem',
                                borderRadius: '8px',
                                border: 'none',
                                backgroundColor: '#4a5568',
                                color: '#fff',
                                cursor: 'pointer',
                                fontSize: '0.95rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#5a6578'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#4a5568'}
                        >
                            ➕ Dodaj z listy usług
                        </button>
                        <button 
                            type="button" 
                            onClick={() => setIsUslugaFormVisible(true)}
                            style={{
                                padding: '0.6rem 1.2rem',
                                borderRadius: '8px',
                                border: 'none',
                                backgroundColor: '#667eea',
                                color: '#fff',
                                cursor: 'pointer',
                                fontSize: '0.95rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#7689ed'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#667eea'}
                        >
                            ➕ Utwórz nową usługę
                        </button>
                    </div>
                </div>

                {/* Podsumowanie */}
                <div style={{ 
                    ...cardStyle,
                    background: 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)'
                }}>
                    <h3 style={{ color: '#e2e8f0', margin: '0 0 1.25rem 0' }}>💰 Podsumowanie korekty</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid #4a5568' }}>
                                <span style={{ color: '#a0aec0' }}>Suma netto:</span>
                                <span style={{ color: podsumowanie.sumaNetto < 0 ? '#fc8181' : '#68d391', fontWeight: 'bold', fontVariantNumeric: 'tabular-nums' }}>
                                    {podsumowanie.sumaNetto.toFixed(2)} zł
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid #4a5568' }}>
                                <span style={{ color: '#a0aec0' }}>Suma VAT:</span>
                                <span style={{ color: podsumowanie.sumaVat < 0 ? '#fc8181' : '#68d391', fontWeight: 'bold', fontVariantNumeric: 'tabular-nums' }}>
                                    {podsumowanie.sumaVat.toFixed(2)} zł
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0' }}>
                                <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.1rem' }}>Suma brutto:</span>
                                <span style={{ 
                                    color: podsumowanie.sumaBrutto < 0 ? '#fc8181' : '#68d391', 
                                    fontWeight: 'bold', 
                                    fontSize: '1.25rem',
                                    fontVariantNumeric: 'tabular-nums'
                                }}>
                                    {podsumowanie.sumaBrutto.toFixed(2)} zł
                                </span>
                            </div>
                        </div>
                        <div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={labelStyle}>Zapłacono</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={zaplacono}
                                    onChange={e => setZaplacono(e.target.value)}
                                    placeholder="0.00"
                                    style={{ ...inputStyle, textAlign: 'right' }}
                                />
                            </div>
                            <div style={{ 
                                padding: '1rem',
                                borderRadius: '8px',
                                backgroundColor: podsumowanie.doZwrotuLubDoplaty < 0 ? 'rgba(252, 129, 129, 0.2)' : 'rgba(104, 211, 145, 0.2)',
                                textAlign: 'center'
                            }}>
                                <div style={{ color: '#a0aec0', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                                    {podsumowanie.doZwrotuLubDoplaty < 0 ? 'DO ZWROTU' : 'DO DOPŁATY'}
                                </div>
                                <div style={{ 
                                    color: podsumowanie.doZwrotuLubDoplaty < 0 ? '#fc8181' : '#68d391', 
                                    fontWeight: 'bold', 
                                    fontSize: '1.5rem',
                                    fontVariantNumeric: 'tabular-nums'
                                }}>
                                    {Math.abs(podsumowanie.doZwrotuLubDoplaty).toFixed(2)} zł
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Przyciski akcji */}
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                    <button 
                        type="button" 
                        onClick={() => navigate('/faktury/lista')}
                        style={{
                            padding: '0.75rem 1.5rem',
                            borderRadius: '8px',
                            border: 'none',
                            backgroundColor: '#4a5568',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#5a6578'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = '#4a5568'}
                    >
                        Anuluj
                    </button>
                    <button 
                        type="submit"
                        style={{
                            padding: '0.75rem 1.5rem',
                            borderRadius: '8px',
                            border: 'none',
                            background: 'linear-gradient(135deg, #c53030 0%, #e53e3e 100%)',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.4)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.3)'; }}
                    >
                        📝 Wystaw fakturę korygującą
                    </button>
                </div>
            </form>
        </div>
    );
};

export default KorektaFakturaPage;

