import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '@/common/api/apiClient';
import { useNotification } from '@/common/context/NotificationContext';
import '@/common/styles/PageStyles.css';

interface VatStawka {
    stawka: number;
    kwota: number;
    etykieta: string;
}

interface SprzedazDzienna {
    data: string;
    dzien: number;
    sumaBrutto: number;
    liczbaFaktur: number;
}

interface FakturaRaport {
    idFaktura: number;
    numerFaktury: string;
    dataWystawienia: string;
    nazwaKontrahenta: string;
    nipKontrahenta: string;
    kwotaNetto: number;
    kwotaVat: number;
    kwotaBrutto: number;
    typDokumentu: string;
}

interface RaportMiesieczny {
    rok: number;
    miesiac: number;
    nazwaMiesiaca: string;
    liczbaFaktur: number;
    liczbaKorekt: number;
    sumaNetto: number;
    sumaVat: number;
    sumaBrutto: number;
    vatWgStawek: VatStawka[];
    sprzedazDzienna: SprzedazDzienna[];
    faktury: FakturaRaport[];
}

const RaportDetailPage = () => {
    const { rok, miesiac } = useParams<{ rok: string; miesiac: string }>();
    const navigate = useNavigate();
    const { showToast, showConfirm } = useNotification();
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [raport, setRaport] = useState<RaportMiesieczny | null>(null);

    const fetchRaport = useCallback(async () => {
        if (!rok || !miesiac) return;
        
        try {
            setLoading(true);
            const response = await apiClient.get(`/api/raporty/${rok}/${miesiac}`);
            setRaport(response.data);
        } catch (error) {
            console.error('Błąd podczas pobierania raportu:', error);
            showToast('Nie udało się pobrać raportu', 'error');
        } finally {
            setLoading(false);
        }
    }, [rok, miesiac, showToast]);

    useEffect(() => {
        fetchRaport();
    }, [fetchRaport]);

    const handleDownloadPdf = async () => {
        try {
            const response = await apiClient.get(`/api/raporty/${rok}/${miesiac}/pdf`, {
                responseType: 'blob',
            });

            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `raport-${rok}-${miesiac}.pdf`;
            link.click();
            window.URL.revokeObjectURL(url);
            
            showToast('Raport PDF został pobrany', 'success');
        } catch (error) {
            console.error('Błąd podczas pobierania PDF:', error);
            showToast('Nie udało się pobrać PDF', 'error');
        }
    };

    const handleSendToAccountant = async () => {
        const confirmed = await showConfirm(
            'Wyślij do księgowości',
            'Czy na pewno chcesz wysłać raport na adres email księgowości?'
        );
        
        if (!confirmed) return;

        try {
            setSending(true);
            const response = await apiClient.post(`/api/raporty/${rok}/${miesiac}/wyslij-do-ksiegowosci`);
            showToast(response.data.message, 'success');
        } catch (error: any) {
            console.error('Błąd podczas wysyłania:', error);
            showToast(error.response?.data?.message || 'Błąd podczas wysyłania emaila', 'error');
        } finally {
            setSending(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pl-PL', {
            style: 'currency',
            currency: 'PLN'
        }).format(value);
    };

    // Oblicz maksymalną wartość dla wykresu
    const maxSprzedaz = raport?.sprzedazDzienna.reduce((max, d) => Math.max(max, Math.abs(d.sumaBrutto)), 0) || 1;

    if (loading) {
        return (
            <div className="page-container">
                <p className="loading-text">Ładowanie raportu...</p>
            </div>
        );
    }

    if (!raport) {
        return (
            <div className="page-container">
                <p className="error-text">Nie udało się załadować raportu</p>
            </div>
        );
    }

    const isEmpty = raport.liczbaFaktur === 0 && raport.liczbaKorekt === 0;

    return (
        <div className="page-container">
            {/* Przycisk cofania NAD nagłówkiem */}
            <div style={{ marginBottom: '1rem' }}>
                <button 
                    className="btn btn-secondary" 
                    onClick={() => navigate('/admin/raporty')}
                    style={{ 
                        padding: '0.6rem 1.2rem',
                        borderRadius: '6px',
                        fontSize: '0.95rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    ← Lista raportów
                </button>
            </div>

            <header className="page-header">
                <h1 style={{ margin: 0 }}>📊 Raport: {raport.nazwaMiesiaca} {raport.rok}</h1>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <button
                        className="btn btn-primary"
                        onClick={handleDownloadPdf}
                        disabled={isEmpty}
                        style={{ opacity: isEmpty ? 0.5 : 1 }}
                    >
                        📥 Pobierz PDF
                    </button>
                    <button
                        className="btn btn-secondary"
                        onClick={handleSendToAccountant}
                        disabled={isEmpty || sending}
                        style={{ opacity: isEmpty || sending ? 0.5 : 1 }}
                    >
                        {sending ? '📧 Wysyłanie...' : '📧 Wyślij do księgowości'}
                    </button>
                    <button
                        className="btn btn-secondary"
                        onClick={() => navigate('/raporty')}
                    >
                        ← Powrót do archiwum
                    </button>
                </div>
            </header>

            {isEmpty ? (
                // Empty State
                <div style={{
                    backgroundColor: '#2d3748',
                    borderRadius: '12px',
                    padding: '4rem',
                    textAlign: 'center',
                    marginTop: '2rem'
                }}>
                    <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>📭</div>
                    <h2 style={{ color: '#e2e8f0', margin: '0 0 0.5rem 0' }}>
                        Brak dokumentów w tym okresie
                    </h2>
                    <p style={{ color: '#a0aec0', maxWidth: '400px', margin: '0 auto' }}>
                        W miesiącu {raport.nazwaMiesiaca} {raport.rok} nie wystawiono żadnych faktur ani korekt.
                    </p>
                </div>
            ) : (
                <>
                    {/* Widgety podsumowujące */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                        gap: '1rem',
                        marginBottom: '2rem'
                    }}>
                        <Widget 
                            icon="📄" 
                            label="Faktury" 
                            value={raport.liczbaFaktur.toString()} 
                            color="#4299e1"
                        />
                        <Widget 
                            icon="📝" 
                            label="Korekty" 
                            value={raport.liczbaKorekt.toString()} 
                            color="#ed8936"
                        />
                        <Widget 
                            icon="💰" 
                            label="Netto" 
                            value={formatCurrency(raport.sumaNetto)} 
                            color="#48bb78"
                            negative={raport.sumaNetto < 0}
                        />
                        <Widget 
                            icon="📊" 
                            label="VAT" 
                            value={formatCurrency(raport.sumaVat)} 
                            color="#9f7aea"
                            negative={raport.sumaVat < 0}
                        />
                        <Widget 
                            icon="💵" 
                            label="Brutto" 
                            value={formatCurrency(raport.sumaBrutto)} 
                            color="#38b2ac"
                            large
                            negative={raport.sumaBrutto < 0}
                        />
                    </div>

                    {/* VAT wg stawek */}
                    {raport.vatWgStawek.length > 0 && (
                        <div style={{
                            backgroundColor: '#2d3748',
                            borderRadius: '12px',
                            padding: '1.5rem',
                            marginBottom: '2rem'
                        }}>
                            <h3 style={{ color: '#e2e8f0', margin: '0 0 1rem 0' }}>
                                📊 Rozliczenie VAT wg stawek
                            </h3>
                            <div style={{
                                display: 'flex',
                                gap: '1rem',
                                flexWrap: 'wrap'
                            }}>
                                {raport.vatWgStawek.map((v) => (
                                    <div
                                        key={v.stawka}
                                        style={{
                                            backgroundColor: '#1a202c',
                                            borderRadius: '8px',
                                            padding: '1rem 1.5rem',
                                            minWidth: '120px',
                                            textAlign: 'center'
                                        }}
                                    >
                                        <div style={{ 
                                            fontSize: '0.9rem', 
                                            color: '#a0aec0',
                                            marginBottom: '0.25rem'
                                        }}>
                                            {v.etykieta}
                                        </div>
                                        <div style={{ 
                                            fontSize: '1.25rem', 
                                            fontWeight: 'bold',
                                            color: v.kwota < 0 ? '#fc8181' : '#68d391'
                                        }}>
                                            {formatCurrency(v.kwota)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Wykres dziennej sprzedaży */}
                    {raport.sprzedazDzienna.length > 0 && (
                        <div style={{
                            backgroundColor: '#2d3748',
                            borderRadius: '12px',
                            padding: '1.5rem',
                            marginBottom: '2rem'
                        }}>
                            <h3 style={{ color: '#e2e8f0', margin: '0 0 1rem 0' }}>
                                📈 Sprzedaż dzienna (brutto)
                            </h3>
                            <div style={{
                                display: 'flex',
                                alignItems: 'flex-end',
                                gap: '4px',
                                height: '200px',
                                paddingTop: '20px'
                            }}>
                                {/* Generuj wszystkie dni miesiąca */}
                                {Array.from({ length: new Date(raport.rok, raport.miesiac, 0).getDate() }, (_, i) => {
                                    const dzien = i + 1;
                                    const sprzedaz = raport.sprzedazDzienna.find(s => s.dzien === dzien);
                                    const wartosc = sprzedaz?.sumaBrutto || 0;
                                    const wysokosc = maxSprzedaz > 0 ? (Math.abs(wartosc) / maxSprzedaz) * 160 : 0;
                                    
                                    return (
                                        <div
                                            key={dzien}
                                            style={{
                                                flex: 1,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                height: '100%',
                                                justifyContent: 'flex-end'
                                            }}
                                            title={sprzedaz ? `${dzien}.${raport.miesiac}: ${formatCurrency(wartosc)} (${sprzedaz.liczbaFaktur} dok.)` : `${dzien}.${raport.miesiac}: brak`}
                                        >
                                            <div
                                                style={{
                                                    width: '100%',
                                                    height: `${Math.max(wysokosc, 2)}px`,
                                                    backgroundColor: wartosc < 0 ? '#fc8181' : wartosc > 0 ? '#4299e1' : '#4a5568',
                                                    borderRadius: '2px 2px 0 0',
                                                    transition: 'height 0.3s ease'
                                                }}
                                            />
                                            <div style={{
                                                fontSize: '0.65rem',
                                                color: '#718096',
                                                marginTop: '4px'
                                            }}>
                                                {dzien}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Lista faktur */}
                    <div style={{
                        backgroundColor: '#2d3748',
                        borderRadius: '12px',
                        padding: '1.5rem'
                    }}>
                        <h3 style={{ color: '#e2e8f0', margin: '0 0 1rem 0' }}>
                            📋 Lista dokumentów ({raport.faktury.length})
                        </h3>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Numer</th>
                                        <th>Data</th>
                                        <th>Kontrahent</th>
                                        <th>NIP</th>
                                        <th style={{ textAlign: 'right' }}>Netto</th>
                                        <th style={{ textAlign: 'right' }}>VAT</th>
                                        <th style={{ textAlign: 'right' }}>Brutto</th>
                                        <th>Typ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {raport.faktury.map((f) => {
                                        const isKorekta = f.typDokumentu === 'KOREKTA';
                                        return (
                                            <tr
                                                key={f.idFaktura}
                                                style={{
                                                    backgroundColor: isKorekta ? 'rgba(239, 68, 68, 0.1)' : 'transparent'
                                                }}
                                            >
                                                <td>
                                                    <span
                                                        onClick={() => {
                                                            // Otwórz PDF faktury w nowej karcie
                                                            apiClient.get(`/api/fakturyvat/${f.idFaktura}/pdf`, { responseType: 'blob' })
                                                                .then(response => {
                                                                    const blob = new Blob([response.data], { type: 'application/pdf' });
                                                                    const url = window.URL.createObjectURL(blob);
                                                                    window.open(url, '_blank');
                                                                })
                                                                .catch(() => showToast('Nie udało się otworzyć PDF', 'error'));
                                                        }}
                                                        style={{
                                                            color: '#4299e1',
                                                            cursor: 'pointer',
                                                            textDecoration: 'underline'
                                                        }}
                                                        title="Kliknij aby otworzyć PDF"
                                                    >
                                                        {f.numerFaktury}
                                                    </span>
                                                </td>
                                                <td>{new Date(f.dataWystawienia).toLocaleDateString()}</td>
                                                <td>
                                                    <span
                                                        onClick={() => navigate(`/kontrahenci?search=${encodeURIComponent(f.nazwaKontrahenta)}`)}
                                                        style={{
                                                            color: '#4299e1',
                                                            cursor: 'pointer',
                                                            textDecoration: 'underline'
                                                        }}
                                                        title="Kliknij aby przejść do kontrahenta"
                                                    >
                                                        {f.nazwaKontrahenta}
                                                    </span>
                                                </td>
                                                <td>{f.nipKontrahenta}</td>
                                                <td style={{ 
                                                    textAlign: 'right',
                                                    color: f.kwotaNetto < 0 ? '#fc8181' : 'inherit'
                                                }}>
                                                    {formatCurrency(f.kwotaNetto)}
                                                </td>
                                                <td style={{ 
                                                    textAlign: 'right',
                                                    color: f.kwotaVat < 0 ? '#fc8181' : 'inherit'
                                                }}>
                                                    {formatCurrency(f.kwotaVat)}
                                                </td>
                                                <td style={{ 
                                                    textAlign: 'right',
                                                    fontWeight: 'bold',
                                                    color: f.kwotaBrutto < 0 ? '#fc8181' : 'inherit'
                                                }}>
                                                    {formatCurrency(f.kwotaBrutto)}
                                                </td>
                                                <td>
                                                    <span style={{
                                                        padding: '2px 8px',
                                                        borderRadius: '4px',
                                                        fontSize: '0.8rem',
                                                        backgroundColor: isKorekta ? '#fed7d7' : '#c6f6d5',
                                                        color: isKorekta ? '#c53030' : '#276749'
                                                    }}>
                                                        {f.typDokumentu}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot>
                                    <tr style={{ backgroundColor: '#1a202c', fontWeight: 'bold' }}>
                                        <td colSpan={4}>RAZEM</td>
                                        <td style={{ 
                                            textAlign: 'right',
                                            color: raport.sumaNetto < 0 ? '#fc8181' : '#68d391'
                                        }}>
                                            {formatCurrency(raport.sumaNetto)}
                                        </td>
                                        <td style={{ 
                                            textAlign: 'right',
                                            color: raport.sumaVat < 0 ? '#fc8181' : '#68d391'
                                        }}>
                                            {formatCurrency(raport.sumaVat)}
                                        </td>
                                        <td style={{ 
                                            textAlign: 'right',
                                            color: raport.sumaBrutto < 0 ? '#fc8181' : '#68d391'
                                        }}>
                                            {formatCurrency(raport.sumaBrutto)}
                                        </td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

// Komponent widgetu
interface WidgetProps {
    icon: string;
    label: string;
    value: string;
    color: string;
    large?: boolean;
    negative?: boolean;
}

const Widget = ({ icon, label, value, color, large, negative }: WidgetProps) => (
    <div style={{
        backgroundColor: '#2d3748',
        borderRadius: '12px',
        padding: large ? '1.5rem' : '1.25rem',
        borderLeft: `4px solid ${negative ? '#fc8181' : color}`,
        gridColumn: large ? 'span 1' : undefined
    }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.25rem' }}>{icon}</span>
            <span style={{ color: '#a0aec0', fontSize: '0.9rem' }}>{label}</span>
        </div>
        <div style={{ 
            fontSize: large ? '1.5rem' : '1.25rem', 
            fontWeight: 'bold',
            color: negative ? '#fc8181' : '#fff'
        }}>
            {value}
        </div>
    </div>
);

export default RaportDetailPage;

