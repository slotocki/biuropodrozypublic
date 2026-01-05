// src/components/offer/forms/Step3_Transport.tsx
import React, { useState, useEffect } from 'react';
import apiClient from '@/common/api/apiClient';
import type { OfertaCreateDto } from '@/common/api/ofertaApi';

interface Step3Props {
    data: OfertaCreateDto;
    updateData: (data: Partial<OfertaCreateDto>) => void;
    onNext: () => void;
    onPrev: () => void;
}

interface Transport {
    idTransport: number;
    rodzajTransportu: string;
    iloscMiejsc?: number;
}

interface MiejsceOdjazdu {
    idMiejsce: number;
    nazwaMiejsca: string;
    adres?: string;
}

const Step3Transport: React.FC<Step3Props> = ({ data, updateData, onNext, onPrev }) => {
    const [transporty, setTransporty] = useState<Transport[]>([]);
    const [miejscaOdjazdu, setMiejscaOdjazdu] = useState<MiejsceOdjazdu[]>([]);

    useEffect(() => {
        fetchTransporty();
        fetchMiejscaOdjazdu();
    }, []);

    const fetchTransporty = async () => {
        try {
            // ✅ POPRAWIONA ŚCIEŻKA
            const response = await apiClient.get('/api/SimpleDictionary/transport');
            setTransporty(response.data);
        } catch (err) {
            console.error('Błąd podczas pobierania transportów:', err);
        }
    };

    const fetchMiejscaOdjazdu = async () => {
        try {
            const response = await apiClient.get('/api/SimpleDictionary/miejsce');
            setMiejscaOdjazdu(response.data);
        } catch (err) {
            console.error('Błąd podczas pobierania miejsc odjazdu:', err);
        }
    };

    const toggleTransport = (idTransport: number) => {
        const newTransporty = data.idTransporty.includes(idTransport)
            ? data.idTransporty.filter(id => id !== idTransport)
            : [...data.idTransporty, idTransport];

        updateData({ idTransporty: newTransporty });
    };

    const toggleMiejsceOdjazdu = (idMiejsce: number) => {
        const newMiejsca = data.idMiejscaOdjazdu.includes(idMiejsce)
            ? data.idMiejscaOdjazdu.filter(id => id !== idMiejsce)
            : [...data.idMiejscaOdjazdu, idMiejsce];

        updateData({ idMiejscaOdjazdu: newMiejsca });
    };

    const handleNext = () => {
        if (data.idTransporty.length === 0) {
            alert('Wybierz przynajmniej jeden transport!');
            return;
        }
        if (!data.iloscMiejscTransport || data.iloscMiejscTransport <= 0) {
            alert('Podaj ilość miejsc w transporcie!');
            return;
        }
        onNext();
    };

    return (
        <div>
            <h2 style={{ color: '#f7fafc', marginBottom: '1.5rem' }}>Krok 3: Transport i miejsca odjazdu</h2>

            {/* Ilość miejsc w transporcie */}
            <div className="form-group">
                <label className="form-label">Ilość miejsc w transporcie *</label>
                <input
                    type="number"
                    className="form-input"
                    value={data.iloscMiejscTransport || ''}
                    onChange={(e) => updateData({ iloscMiejscTransport: Number(e.target.value) })}
                    placeholder="np. 50"
                    min="1"
                />
            </div>

            {/* Wybór transportów */}
            <div className="form-group">
                <label className="form-label">Rodzaj transportu *</label>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: '1rem',
                    marginTop: '0.5rem'
                }}>
                    {transporty.map(transport => (
                        <label
                            key={transport.idTransport}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '1rem',
                                backgroundColor: data.idTransporty.includes(transport.idTransport) ? '#4a5568' : '#2d3748',
                                border: data.idTransporty.includes(transport.idTransport) ? '2px solid #90cdf4' : '1px solid #4a5568',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                color: '#cbd5e0'
                            }}
                        >
                            <input
                                type="checkbox"
                                checked={data.idTransporty.includes(transport.idTransport)}
                                onChange={() => toggleTransport(transport.idTransport)}
                                style={{ width: '18px', height: '18px' }}
                            />
                            <div>
                                <div style={{ fontWeight: 'bold', color: '#f7fafc' }}>
                                    {transport.rodzajTransportu}
                                </div>
                                {transport.iloscMiejsc && (
                                    <div style={{ fontSize: '0.85rem', color: '#a0aec0' }}>
                                        Miejsca: {transport.iloscMiejsc}
                                    </div>
                                )}
                            </div>
                        </label>
                    ))}
                </div>
                {transporty.length === 0 && (
                    <p style={{ color: '#a0aec0', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                        Brak dostępnych transportów. Dodaj je w konfiguracji.
                    </p>
                )}
            </div>

            {/* Wybór miejsc odjazdu */}
            <div className="form-group">
                <label className="form-label">Miejsca odjazdu (opcjonalne)</label>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                    gap: '1rem',
                    marginTop: '0.5rem'
                }}>
                    {miejscaOdjazdu.map(miejsce => (
                        <label
                            key={miejsce.idMiejsce}
                            style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '0.75rem',
                                padding: '1rem',
                                backgroundColor: data.idMiejscaOdjazdu.includes(miejsce.idMiejsce) ? '#4a5568' : '#2d3748',
                                border: data.idMiejscaOdjazdu.includes(miejsce.idMiejsce) ? '2px solid #90cdf4' : '1px solid #4a5568',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                color: '#cbd5e0'
                            }}
                        >
                            <input
                                type="checkbox"
                                checked={data.idMiejscaOdjazdu.includes(miejsce.idMiejsce)}
                                onChange={() => toggleMiejsceOdjazdu(miejsce.idMiejsce)}
                                style={{ width: '18px', height: '18px', marginTop: '2px' }}
                            />
                            <div>
                                <div style={{ fontWeight: 'bold', color: '#f7fafc' }}>
                                    {miejsce.nazwaMiejsca}
                                </div>
                                {miejsce.adres && (
                                    <div style={{ fontSize: '0.85rem', color: '#a0aec0', marginTop: '0.25rem' }}>
                                        📍 {miejsce.adres}
                                    </div>
                                )}
                            </div>
                        </label>
                    ))}
                </div>
                {miejscaOdjazdu.length === 0 && (
                    <p style={{ color: '#a0aec0', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                        Brak dostępnych miejsc odjazdu. Dodaj je w konfiguracji.
                    </p>
                )}
            </div>

            {/* Podsumowanie wyboru */}
            {(data.idTransporty.length > 0 || data.idMiejscaOdjazdu.length > 0) && (
                <div style={{
                    backgroundColor: '#1a202c',
                    padding: '1rem',
                    borderRadius: '6px',
                    marginTop: '1rem'
                }}>
                    <h4 style={{ color: '#cbd5e0', marginBottom: '0.75rem' }}>Wybrano:</h4>
                    <div style={{ color: '#a0aec0', fontSize: '0.9rem' }}>
                        🚌 Transporty: {data.idTransporty.length}<br />
                        📍 Miejsca odjazdu: {data.idMiejscaOdjazdu.length}
                    </div>
                </div>
            )}

            {/* Nawigacja */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
                <button onClick={onPrev} className="btn btn-secondary">
                    ← Wstecz
                </button>
                <button onClick={handleNext} className="btn btn-primary">
                    Dalej →
                </button>
            </div>
        </div>
    );
};

export default Step3Transport;
