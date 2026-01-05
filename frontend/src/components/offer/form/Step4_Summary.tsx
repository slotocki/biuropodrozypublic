import React, { useState, useEffect } from 'react';
import type { OfertaCreateDto, NazwaHandlowaOption } from '@/api/ofertaApi';
import ofertaApi from '@/api/ofertaApi';
import apiClient from '@/api/apiClient';
interface Step4Props {
    data: OfertaCreateDto;
    onSubmit: () => void;
    onPrev: () => void;
    loading: boolean;
}

interface Destynacja {
    idDestynacja: number;
    nazwa: string;
}

interface Osrodek {
    idOsrodek: number;
    nazwaOsrodka: string;
}

interface Transport {
    idTransport: number;
    rodzajTransportu: string;
}

interface MiejsceOdjazdu {
    idMiejsce: number;
    nazwaMiejsca: string;
}

const Step4Summary: React.FC<Step4Props> = ({ data, onSubmit, onPrev, loading }) => {
    const [destynacje, setDestynacje] = useState<Destynacja[]>([]);
    const [nazwyHandlowe, setNazwyHandlowe] = useState<NazwaHandlowaOption[]>([]);
    const [osrodki, setOsrodki] = useState<Osrodek[]>([]);
    const [transporty, setTransporty] = useState<Transport[]>([]);
    const [miejsca, setMiejsca] = useState<MiejsceOdjazdu[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [destRes, nhRes, osRes, trRes, mjRes] = await Promise.all([
                apiClient.get('/api/SimpleDictionary/destynacja'),
                ofertaApi.getNazwyHandlowe(),
                apiClient.get('/api/Osrodek'),
                apiClient.get('/api/SimpleDictionary/transport'),
                apiClient.get('/api/SimpleDictionary/miejsce'),
            ]);
            setDestynacje(destRes.data);
            setNazwyHandlowe(nhRes);
            setOsrodki(osRes.data);
            setTransporty(trRes.data);
            setMiejsca(mjRes.data);
        } catch (err) {
            console.error('Błąd podczas pobierania danych słownikowych:', err);
        }
    };

    const getDestynacjaNazwa = () => {
        return destynacje.find(d => d.idDestynacja === data.idDestynacja)?.nazwa || 'Nieznana';
    };

    const getNazwaHandlowa = () => {
        return nazwyHandlowe.find(n => n.idNazwaHandlowa === data.idNazwaHandlowa)?.nazwa || 'Nieznana';
    };

    const getOsrodekNazwa = (idOsrodek: number) => {
        return osrodki.find(o => o.idOsrodek === idOsrodek)?.nazwaOsrodka || `ID: ${idOsrodek}`;
    };

    const getTransportNazwa = (idTransport: number) => {
        return transporty.find(t => t.idTransport === idTransport)?.rodzajTransportu || `ID: ${idTransport}`;
    };

    const getMiejsceNazwa = (idMiejsce: number) => {
        return miejsca.find(m => m.idMiejsce === idMiejsce)?.nazwaMiejsca || `ID: ${idMiejsce}`;
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'Brak';
        const date = new Date(dateString);
        return date.toLocaleDateString('pl-PL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    const formatDateTime = (dateString?: string) => {
        if (!dateString) return 'Nie ustawiono';
        const date = new Date(dateString);
        return date.toLocaleString('pl-PL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div>
            <h2 style={{ color: '#f7fafc', marginBottom: '1.5rem' }}>Krok 4: Podsumowanie</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Podstawowe informacje */}
                <div style={{
                    backgroundColor: '#1a202c',
                    padding: '1.5rem',
                    borderRadius: '6px'
                }}>
                    <h3 style={{ color: '#90cdf4', marginBottom: '1rem', fontSize: '1.1rem' }}>
                        📋 Podstawowe informacje
                    </h3>
                    <div style={{ color: '#cbd5e0', fontSize: '0.95rem', lineHeight: '1.8' }}>
                        <div><strong style={{ color: '#f7fafc' }}>Nazwa handlowa:</strong> {getNazwaHandlowa()}</div>
                        <div><strong style={{ color: '#f7fafc' }}>Destynacja:</strong> {getDestynacjaNazwa()}</div>
                        <div><strong style={{ color: '#f7fafc' }}>Termin:</strong> {formatDate(data.terminOd)} - {formatDate(data.terminDo)}</div>
                        <div><strong style={{ color: '#f7fafc' }}>Zakwaterowanie:</strong> {formatDateTime(data.dataZakwaterowania)}</div>
                        <div><strong style={{ color: '#f7fafc' }}>Wykwaterowanie:</strong> {formatDateTime(data.dataWykwaterowania)}</div>
                        {data.opis && (
                            <div style={{ marginTop: '0.5rem' }}>
                                <strong style={{ color: '#f7fafc' }}>Opis:</strong>
                                <div style={{ marginTop: '0.25rem', color: '#a0aec0', fontSize: '0.9rem' }}>
                                    {data.opis}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Ośrodki i pokoje */}
                <div style={{
                    backgroundColor: '#1a202c',
                    padding: '1.5rem',
                    borderRadius: '6px'
                }}>
                    <h3 style={{ color: '#90cdf4', marginBottom: '1rem', fontSize: '1.1rem' }}>
                        🏨 Ośrodki i pokoje
                    </h3>
                    {data.osrodki.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {data.osrodki.map((os, idx) => (
                                <div
                                    key={idx}
                                    style={{
                                        backgroundColor: '#2d3748',
                                        padding: '1rem',
                                        borderRadius: '4px',
                                        borderLeft: '3px solid #90cdf4'
                                    }}
                                >
                                    <div style={{ color: '#f7fafc', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                                        {getOsrodekNazwa(os.idOsrodek)}
                                    </div>
                                    <div style={{ color: '#cbd5e0', fontSize: '0.9rem' }}>
                                        💰 Cena: <strong>{os.cenaOs.toFixed(2)} zł</strong> za osobę
                                    </div>
                                    <div style={{ color: '#cbd5e0', fontSize: '0.9rem' }}>
                                        🛏️ Pokoje: <strong>{os.idPokoje.length}</strong>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ color: '#a0aec0' }}>Brak ośrodków</p>
                    )}
                </div>

                {/* Transport */}
                <div style={{
                    backgroundColor: '#1a202c',
                    padding: '1.5rem',
                    borderRadius: '6px'
                }}>
                    <h3 style={{ color: '#90cdf4', marginBottom: '1rem', fontSize: '1.1rem' }}>
                        🚌 Transport
                    </h3>
                    <div style={{ color: '#cbd5e0', fontSize: '0.95rem', lineHeight: '1.8' }}>
                        <div>
                            <strong style={{ color: '#f7fafc' }}>Ilość miejsc:</strong> {data.iloscMiejscTransport}
                        </div>
                        {data.idTransporty.length > 0 ? (
                            <div style={{ marginTop: '0.5rem' }}>
                                <strong style={{ color: '#f7fafc' }}>Rodzaje transportu:</strong>
                                <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    {data.idTransporty.map(id => (
                                        <span
                                            key={id}
                                            style={{
                                                backgroundColor: '#4a5568',
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '12px',
                                                fontSize: '0.85rem',
                                                color: '#e2e8f0'
                                            }}
                                        >
                      {getTransportNazwa(id)}
                    </span>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div style={{ color: '#a0aec0' }}>Brak wybranego transportu</div>
                        )}
                    </div>
                </div>

                {/* Miejsca odjazdu */}
                {data.idMiejscaOdjazdu.length > 0 && (
                    <div style={{
                        backgroundColor: '#1a202c',
                        padding: '1.5rem',
                        borderRadius: '6px'
                    }}>
                        <h3 style={{ color: '#90cdf4', marginBottom: '1rem', fontSize: '1.1rem' }}>
                            📍 Miejsca odjazdu
                        </h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {data.idMiejscaOdjazdu.map(id => (
                                <span
                                    key={id}
                                    style={{
                                        backgroundColor: '#4a5568',
                                        padding: '0.5rem 1rem',
                                        borderRadius: '12px',
                                        fontSize: '0.9rem',
                                        color: '#e2e8f0'
                                    }}
                                >
                  {getMiejsceNazwa(id)}
                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Ostrzeżenie */}
                <div style={{
                    backgroundColor: 'rgba(237, 137, 54, 0.1)',
                    border: '1px solid rgba(237, 137, 54, 0.3)',
                    padding: '1rem',
                    borderRadius: '6px',
                    color: '#fbd38d'
                }}>
                    ⚠️ Sprawdź dokładnie wszystkie dane przed zapisaniem. Po utworzeniu oferty możesz ją edytować.
                </div>
            </div>

            {/* Nawigacja */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
                <button onClick={onPrev} className="btn btn-secondary" disabled={loading}>
                    ← Wstecz
                </button>
                <button
                    onClick={onSubmit}
                    className="btn btn-primary"
                    disabled={loading}
                    style={{
                        opacity: loading ? 0.6 : 1,
                        cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                >
                    {loading ? '⏳ Tworzenie...' : '✅ Utwórz ofertę'}
                </button>
            </div>
        </div>
    );
};

export default Step4Summary;
