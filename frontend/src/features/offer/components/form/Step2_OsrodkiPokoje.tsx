// src/components/offer/forms/Step2_OsrodkiPokoje.tsx
import React, { useState, useEffect } from 'react';
import apiClient from '@/common/api/apiClient';
import type { OfertaCreateDto } from '@/common/api/ofertaApi';
interface Step2Props {
    data: OfertaCreateDto;
    updateData: (data: Partial<OfertaCreateDto>) => void;
    onNext: () => void;
    onPrev: () => void;
}

interface Osrodek {
    idOsrodek: number;
    nazwaOsrodka: string;
}

interface Pokoj {
    idPokoj: number;
    numerPokoju: string;
    rodzajPokoju: string;
    idOsrodek: number;
}

const Step2OsrodkiPokoje: React.FC<Step2Props> = ({ data, updateData, onNext, onPrev }) => {
    const [osrodki, setOsrodki] = useState<Osrodek[]>([]);
    const [pokoje, setPokoje] = useState<Pokoj[]>([]);
    const [selectedOsrodek, setSelectedOsrodek] = useState<number>(0);
    const [cenaOs, setCenaOs] = useState<string>('');
    const [selectedPokoje, setSelectedPokoje] = useState<number[]>([]);

    useEffect(() => {
        fetchOsrodki();
    }, []);

    useEffect(() => {
        if (selectedOsrodek) {
            fetchPokoje(selectedOsrodek);
        }
    }, [selectedOsrodek]);

    const fetchOsrodki = async () => {
        try {
            // ✅ POPRAWIONA ŚCIEŻKA
            const response = await apiClient.get('/api/Osrodek');
            setOsrodki(response.data);
        } catch (err) {
            console.error('Błąd podczas pobierania ośrodków:', err);
        }
    };

    const fetchPokoje = async (idOsrodek: number) => {
        try {
            // ✅ POPRAWIONA ŚCIEŻKA
            const response = await apiClient.get(`/api/Pokoj?idOsrodek=${idOsrodek}`);
            setPokoje(response.data);
        } catch (err) {
            console.error('Błąd podczas pobierania pokoi:', err);
        }
    };

    const handleAddOsrodek = () => {
        if (!selectedOsrodek || !cenaOs || selectedPokoje.length === 0) {
            alert('Wypełnij wszystkie pola i wybierz pokoje!');
            return;
        }

        const newOsrodek = {
            idOsrodek: selectedOsrodek,
            cenaOs: parseFloat(cenaOs),
            idPokoje: selectedPokoje,
        };

        updateData({
            osrodki: [...data.osrodki, newOsrodek],
        });

        // Reset
        setSelectedOsrodek(0);
        setCenaOs('');
        setSelectedPokoje([]);
    };

    const handleRemoveOsrodek = (index: number) => {
        const newOsrodki = data.osrodki.filter((_, i) => i !== index);
        updateData({ osrodki: newOsrodki });
    };

    const togglePokoj = (idPokoj: number) => {
        setSelectedPokoje(prev =>
            prev.includes(idPokoj)
                ? prev.filter(id => id !== idPokoj)
                : [...prev, idPokoj]
        );
    };

    const handleNext = () => {
        if (data.osrodki.length === 0) {
            alert('Dodaj przynajmniej jeden ośrodek!');
            return;
        }
        onNext();
    };

    return (
        <div>
            <h2 style={{ color: '#f7fafc', marginBottom: '1.5rem' }}>Krok 2: Ośrodki i pokoje</h2>

            {/* Formularz dodawania ośrodka */}
            <div style={{
                backgroundColor: '#1a202c',
                padding: '1.5rem',
                borderRadius: '6px',
                marginBottom: '2rem'
            }}>
                <h3 style={{ color: '#cbd5e0', marginBottom: '1rem' }}>Dodaj ośrodek</h3>

                <div className="form-group">
                    <label className="form-label">Wybierz ośrodek</label>
                    <select
                        className="form-select"
                        value={selectedOsrodek || ''}
                        onChange={(e) => setSelectedOsrodek(Number(e.target.value))}
                    >
                        <option value="">Wybierz ośrodek</option>
                        {osrodki.map(os => (
                            <option key={os.idOsrodek} value={os.idOsrodek}>
                                {os.nazwaOsrodka}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label className="form-label">Cena za osobę (zł)</label>
                    <input
                        type="number"
                        className="form-input"
                        value={cenaOs}
                        onChange={(e) => setCenaOs(e.target.value)}
                        placeholder="np. 1200.00"
                        step="0.01"
                    />
                </div>

                {selectedOsrodek > 0 && pokoje.length > 0 && (
                    <div className="form-group">
                        <label className="form-label">Wybierz pokoje</label>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                            gap: '0.5rem',
                            marginTop: '0.5rem'
                        }}>
                            {pokoje.map(pokoj => (
                                <label
                                    key={pokoj.idPokoj}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        padding: '0.5rem',
                                        backgroundColor: selectedPokoje.includes(pokoj.idPokoj) ? '#4a5568' : '#2d3748',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        color: '#cbd5e0',
                                        fontSize: '0.9rem'
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedPokoje.includes(pokoj.idPokoj)}
                                        onChange={() => togglePokoj(pokoj.idPokoj)}
                                    />
                                    {pokoj.numerPokoju || `Pokój ${pokoj.idPokoj}`} ({pokoj.rodzajPokoju})
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                {selectedOsrodek > 0 && pokoje.length === 0 && (
                    <p style={{ color: '#fc8181', fontSize: '0.9rem', marginTop: '1rem' }}>
                        ⚠️ Ten ośrodek nie ma jeszcze pokoi. Dodaj pokoje w konfiguracji ośrodków.
                    </p>
                )}

                <button onClick={handleAddOsrodek} className="btn btn-primary">
                    ➕ Dodaj ośrodek
                </button>
            </div>

            {/* Lista dodanych ośrodków */}
            {data.osrodki.length > 0 && (
                <div>
                    <h3 style={{ color: '#cbd5e0', marginBottom: '1rem' }}>Dodane ośrodki ({data.osrodki.length})</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {data.osrodki.map((os, index) => {
                            const osrodekInfo = osrodki.find(o => o.idOsrodek === os.idOsrodek);
                            return (
                                <div
                                    key={index}
                                    style={{
                                        backgroundColor: '#1a202c',
                                        padding: '1rem',
                                        borderRadius: '6px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}
                                >
                                    <div>
                                        <div style={{ color: '#f7fafc', fontWeight: 'bold' }}>
                                            {osrodekInfo?.nazwaOsrodka}
                                        </div>
                                        <div style={{ color: '#cbd5e0', fontSize: '0.9rem' }}>
                                            Cena: {os.cenaOs.toFixed(2)} zł | Pokoje: {os.idPokoje.length}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveOsrodek(index)}
                                        className="btn btn-danger"
                                    >
                                        🗑️ Usuń
                                    </button>
                                </div>
                            );
                        })}
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

export default Step2OsrodkiPokoje;
