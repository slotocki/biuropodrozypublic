import React, { useState, useEffect, useCallback, useMemo } from 'react';
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

const ROWS_OPTIONS = [10, 25, 50, 100];

const RaportDetailPage = () => {
    const { rok, miesiac } = useParams<{ rok: string; miesiac: string }>();
    const navigate = useNavigate();
    const { showToast, showConfirm } = useNotification();
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [raport, setRaport] = useState<RaportMiesieczny | null>(null);
    
    // Paginacja dla listy dokumentów
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

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

    // Paginacja dla listy dokumentów
    const totalPages = raport ? Math.ceil(raport.faktury.length / rowsPerPage) : 0;
    const paginatedFaktury = useMemo(() => {
        if (!raport) return [];
        const startIndex = (currentPage - 1) * rowsPerPage;
        return raport.faktury.slice(startIndex, startIndex + rowsPerPage);
    }, [raport, currentPage, rowsPerPage]);

    const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setRowsPerPage(Number(e.target.value));
        setCurrentPage(1);
    };

    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > totalPages) return;
        setCurrentPage(newPage);
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

                    {/* Lista faktur - styl jak w FakturyListPage */}
                    <div>
                        <h3 style={{ color: '#e2e8f0', margin: '0 0 1rem 0' }}>
                            📋 Lista dokumentów ({raport.faktury.length})
                        </h3>
                        <div style={{
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
                            borderRadius: '8px',
                            overflow: 'hidden'
                        }}>
                            <table style={{ 
                                width: '100%', 
                                borderCollapse: 'collapse',
                                backgroundColor: '#1e2533'
                            }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#2d3748' }}>
                                        <th style={{ padding: '0.75rem', borderBottom: '1px solid #4a5568', color: '#e2e8f0', textAlign: 'left' }}>Numer</th>
                                        <th style={{ padding: '0.75rem', borderBottom: '1px solid #4a5568', color: '#e2e8f0', textAlign: 'left' }}>Data</th>
                                        <th style={{ padding: '0.75rem', borderBottom: '1px solid #4a5568', color: '#e2e8f0', textAlign: 'left' }}>Kontrahent</th>
                                        <th style={{ padding: '0.75rem', borderBottom: '1px solid #4a5568', color: '#e2e8f0', textAlign: 'left' }}>NIP</th>
                                        <th style={{ padding: '0.75rem', borderBottom: '1px solid #4a5568', color: '#e2e8f0', textAlign: 'right' }}>Netto</th>
                                        <th style={{ padding: '0.75rem', borderBottom: '1px solid #4a5568', color: '#e2e8f0', textAlign: 'right' }}>VAT</th>
                                        <th style={{ padding: '0.75rem', borderBottom: '1px solid #4a5568', color: '#e2e8f0', textAlign: 'right' }}>Brutto</th>
                                        <th style={{ padding: '0.75rem', borderBottom: '1px solid #4a5568', color: '#e2e8f0', textAlign: 'center' }}>Typ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedFaktury.map((f, index) => {
                                        const isKorekta = f.typDokumentu === 'KOREKTA';
                                        const rowBg = isKorekta 
                                            ? 'rgba(252, 129, 129, 0.08)' 
                                            : index % 2 === 0 
                                                ? '#1e2533' 
                                                : '#252d3d';
                                        return (
                                            <tr
                                                key={f.idFaktura}
                                                style={{
                                                    backgroundColor: rowBg,
                                                    transition: 'background-color 0.15s ease'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3a4556'}
                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = rowBg}
                                            >
                                                <td style={{ padding: '0.6rem 0.75rem' }}>
                                                    <span
                                                        onClick={() => {
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
                                                <td style={{ padding: '0.6rem 0.75rem', color: '#e2e8f0' }}>{new Date(f.dataWystawienia).toLocaleDateString()}</td>
                                                <td style={{ padding: '0.6rem 0.75rem' }}>
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
                                                <td style={{ padding: '0.6rem 0.75rem', color: '#a0aec0' }}>{f.nipKontrahenta}</td>
                                                <td style={{ 
                                                    padding: '0.6rem 0.75rem',
                                                    textAlign: 'right',
                                                    color: f.kwotaNetto < 0 ? '#fc8181' : '#e2e8f0',
                                                    fontVariantNumeric: 'tabular-nums'
                                                }}>
                                                    {formatCurrency(f.kwotaNetto)}
                                                </td>
                                                <td style={{ 
                                                    padding: '0.6rem 0.75rem',
                                                    textAlign: 'right',
                                                    color: f.kwotaVat < 0 ? '#fc8181' : '#e2e8f0',
                                                    fontVariantNumeric: 'tabular-nums'
                                                }}>
                                                    {formatCurrency(f.kwotaVat)}
                                                </td>
                                                <td style={{ 
                                                    padding: '0.6rem 0.75rem',
                                                    textAlign: 'right',
                                                    fontWeight: 'bold',
                                                    color: f.kwotaBrutto < 0 ? '#fc8181' : '#e2e8f0',
                                                    fontVariantNumeric: 'tabular-nums'
                                                }}>
                                                    {formatCurrency(f.kwotaBrutto)}
                                                </td>
                                                <td style={{ padding: '0.6rem 0.75rem', textAlign: 'center' }}>
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
                                    <tr style={{ backgroundColor: '#1a202c' }}>
                                        <td colSpan={4} style={{ padding: '0.75rem', color: '#e2e8f0', fontWeight: 'bold' }}>RAZEM</td>
                                        <td style={{ 
                                            padding: '0.75rem',
                                            textAlign: 'right',
                                            fontWeight: 'bold',
                                            color: raport.sumaNetto < 0 ? '#fc8181' : '#68d391',
                                            fontVariantNumeric: 'tabular-nums'
                                        }}>
                                            {formatCurrency(raport.sumaNetto)}
                                        </td>
                                        <td style={{ 
                                            padding: '0.75rem',
                                            textAlign: 'right',
                                            fontWeight: 'bold',
                                            color: raport.sumaVat < 0 ? '#fc8181' : '#68d391',
                                            fontVariantNumeric: 'tabular-nums'
                                        }}>
                                            {formatCurrency(raport.sumaVat)}
                                        </td>
                                        <td style={{ 
                                            padding: '0.75rem',
                                            textAlign: 'right',
                                            fontWeight: 'bold',
                                            color: raport.sumaBrutto < 0 ? '#fc8181' : '#68d391',
                                            fontVariantNumeric: 'tabular-nums'
                                        }}>
                                            {formatCurrency(raport.sumaBrutto)}
                                        </td>
                                        <td style={{ padding: '0.75rem' }}></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* Paginacja na dole - identyczna jak w FakturyListPage */}
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            marginTop: '1rem',
                            padding: '0.75rem 0',
                            color: '#a0aec0',
                            fontSize: '0.9rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span>Pokaż</span>
                                <select
                                    value={rowsPerPage}
                                    onChange={handleRowsPerPageChange}
                                    style={{
                                        padding: '0.4rem 1.8rem 0.4rem 0.6rem',
                                        borderRadius: '4px',
                                        border: '1px solid #4a5568',
                                        backgroundColor: '#2d3748',
                                        color: '#fff',
                                        fontSize: '0.85rem',
                                        cursor: 'pointer',
                                        appearance: 'none',
                                        WebkitAppearance: 'none',
                                        MozAppearance: 'none',
                                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23a0aec0' d='M6 8L2 4h8z'/%3E%3C/svg%3E")`,
                                        backgroundRepeat: 'no-repeat',
                                        backgroundPosition: 'right 0.5rem center',
                                        backgroundSize: '12px'
                                    }}
                                >
                                    {ROWS_OPTIONS.map(option => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                                <span>z {raport.faktury.length} dokumentów</span>
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <button
                                    onClick={() => handlePageChange(1)}
                                    disabled={currentPage === 1}
                                    style={{
                                        padding: '0.4rem 0.6rem',
                                        borderRadius: '4px',
                                        border: 'none',
                                        backgroundColor: currentPage === 1 ? '#374151' : '#4a5568',
                                        color: currentPage === 1 ? '#6b7280' : '#fff',
                                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                        fontSize: '0.85rem'
                                    }}
                                >
                                    ««
                                </button>
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    style={{
                                        padding: '0.4rem 0.6rem',
                                        borderRadius: '4px',
                                        border: 'none',
                                        backgroundColor: currentPage === 1 ? '#374151' : '#4a5568',
                                        color: currentPage === 1 ? '#6b7280' : '#fff',
                                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                        fontSize: '0.85rem'
                                    }}
                                >
                                    «
                                </button>
                                <span style={{ padding: '0 0.5rem', color: '#e2e8f0' }}>
                                    Strona {currentPage} z {totalPages || 1}
                                </span>
                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages || totalPages === 0}
                                    style={{
                                        padding: '0.4rem 0.6rem',
                                        borderRadius: '4px',
                                        border: 'none',
                                        backgroundColor: currentPage === totalPages || totalPages === 0 ? '#374151' : '#4a5568',
                                        color: currentPage === totalPages || totalPages === 0 ? '#6b7280' : '#fff',
                                        cursor: currentPage === totalPages || totalPages === 0 ? 'not-allowed' : 'pointer',
                                        fontSize: '0.85rem'
                                    }}
                                >
                                    »
                                </button>
                                <button
                                    onClick={() => handlePageChange(totalPages)}
                                    disabled={currentPage === totalPages || totalPages === 0}
                                    style={{
                                        padding: '0.4rem 0.6rem',
                                        borderRadius: '4px',
                                        border: 'none',
                                        backgroundColor: currentPage === totalPages || totalPages === 0 ? '#374151' : '#4a5568',
                                        color: currentPage === totalPages || totalPages === 0 ? '#6b7280' : '#fff',
                                        cursor: currentPage === totalPages || totalPages === 0 ? 'not-allowed' : 'pointer',
                                        fontSize: '0.85rem'
                                    }}
                                >
                                    »»
                                </button>
                            </div>
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

