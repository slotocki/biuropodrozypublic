// src/pages/offer/OfertaDetailPage.tsx - PEŁNA WERSJA
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ofertaApi } from '@/api/ofertaApi';
import type { OfertaDetail } from '@/api/ofertaApi';
import { useNotification } from '@/context/NotificationContext';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import '@/pages/PageStyles.css';

export const OfertaDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { showToast } = useNotification();
    const [oferta, setOferta] = useState<OfertaDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showArchiveModal, setShowArchiveModal] = useState(false);
    const [showRestoreModal, setShowRestoreModal] = useState(false);

    useEffect(() => {
        if (!id || isNaN(Number(id))) {
            setError('Nieprawidłowe ID oferty');
            setLoading(false);
            return;
        }

        fetchOferta(Number(id));
    }, [id]);

    const fetchOferta = async (ofertaId: number) => {
        setLoading(true);
        setError(null);

        try {
            const data = await ofertaApi.getOferta(ofertaId);
            setOferta(data);
        } catch (err) {
            console.error('Błąd podczas pobierania oferty:', err);
            setError('Nie udało się pobrać szczegółów oferty.');
            showToast('Nie udało się pobrać szczegółów oferty.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleArchive = async () => {
        if (!oferta) return;

        try {
            await ofertaApi.archiveOferta(oferta.idOferta);
            showToast('Oferta została zarchiwizowana', 'success');
            setShowArchiveModal(false);
            await fetchOferta(oferta.idOferta);
        } catch (err) {
            console.error('Błąd archiwizacji:', err);
            showToast('Nie udało się zarchiwizować oferty', 'error');
        }
    };

    const handleRestore = async () => {
        if (!oferta) return;

        try {
            await ofertaApi.restoreOferta(oferta.idOferta);
            showToast('Oferta została przywrócona', 'success');
            setShowRestoreModal(false);
            await fetchOferta(oferta.idOferta);
        } catch (err) {
            console.error('Błąd przywracania:', err);
            showToast('Nie udało się przywrócić oferty', 'error');
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Brak daty';
        const date = new Date(dateString);
        return date.toLocaleDateString('pl-PL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    const formatDateTime = (dateString?: string) => {
        if (!dateString) return 'Brak daty';
        const date = new Date(dateString);
        return date.toLocaleString('pl-PL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <div className="page-container">
                <p className="loading-text">Ładowanie szczegółów oferty...</p>
            </div>
        );
    }

    if (error || !oferta) {
        return (
            <div className="page-container">
                <div className="error-text">{error || 'Nie znaleziono oferty'}</div>
                <button
                    onClick={() => navigate('/oferta/lista')}
                    className="btn btn-secondary"
                    style={{ marginTop: '1rem' }}
                >
                    ← Powrót do listy ofert
                </button>
            </div>
        );
    }

    return (
        <div className="page-container">
            <header className="page-header">
                <div>
                    <button
                        onClick={() => navigate('/oferta/lista')}
                        className="btn btn-secondary"
                        style={{ marginBottom: '1rem' }}
                    >
                        ← Powrót
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <h1>{oferta.nazwaHandlowa}</h1>

                        {/* Status badge */}
                        <span style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '20px',
                            fontSize: '0.9rem',
                            fontWeight: 'bold',
                            backgroundColor: oferta.czyAktywna ? 'rgba(72, 187, 120, 0.2)' : 'rgba(160, 174, 192, 0.2)',
                            color: oferta.czyAktywna ? '#68d391' : '#cbd5e0',
                            border: oferta.czyAktywna ? '1px solid rgba(72, 187, 120, 0.3)' : '1px solid rgba(160, 174, 192, 0.3)'
                        }}>
                            {oferta.czyAktywna ? '✓ Aktywna' : '⊗ Zarchiwizowana'}
                        </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '10px', color: '#cbd5e0' }}>
                        <span>📍 {oferta.nazwaDestynacji}</span>
                        <span>📅 {formatDate(oferta.terminOd)} - {formatDate(oferta.terminDo)}</span>
                        <span style={{ color: oferta.wolneMiejsca > 0 ? '#68d391' : '#fc8181' }}>
                            👥 {oferta.wolneMiejsca} wolnych miejsc
                        </span>
                    </div>
                </div>

                <div className="action-buttons">
                    {oferta.czyAktywna ? (
                        <>
                            <button
                                onClick={() => navigate(`/oferta/edytuj/${oferta.idOferta}`)}
                                className="btn btn-primary"
                            >
                                ✏️ Edytuj
                            </button>
                            <button
                                onClick={() => setShowArchiveModal(true)}
                                className="btn btn-danger"
                            >
                                🗄️ Archiwizuj
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => setShowRestoreModal(true)}
                            className="btn btn-primary"
                        >
                            ↺ Przywróć
                        </button>
                    )}
                </div>
            </header>

            {/* Szczegóły oferty */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                {/* Lewa kolumna */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Informacje podstawowe */}
                    <div style={{
                        backgroundColor: '#2d3748',
                        padding: '24px',
                        borderRadius: '8px',
                        border: '1px solid #4a5568'
                    }}>
                        <h2 style={{ color: '#f7fafc', marginBottom: '16px' }}>Informacje podstawowe</h2>

                        {oferta.opis && (
                            <div style={{ marginBottom: '16px' }}>
                                <h3 style={{ color: '#cbd5e0', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>Opis:</h3>
                                <p style={{ color: '#a0aec0', whiteSpace: 'pre-wrap' }}>{oferta.opis}</p>
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                                <span style={{ color: '#cbd5e0', fontWeight: 'bold' }}>Zakwaterowanie:</span>
                                <p style={{ color: '#a0aec0' }}>{formatDateTime(oferta.dataZakwaterowania)}</p>
                            </div>
                            <div>
                                <span style={{ color: '#cbd5e0', fontWeight: 'bold' }}>Wykwaterowanie:</span>
                                <p style={{ color: '#a0aec0' }}>{formatDateTime(oferta.dataWykwaterowania)}</p>
                            </div>
                            <div>
                                <span style={{ color: '#cbd5e0', fontWeight: 'bold' }}>Ilość noclegów:</span>
                                <p style={{ color: '#a0aec0' }}>{oferta.iloscNoclegow}</p>
                            </div>
                            <div>
                                <span style={{ color: '#cbd5e0', fontWeight: 'bold' }}>Miejsca transport:</span>
                                <p style={{ color: '#a0aec0' }}>{oferta.iloscMiejscTransport}</p>
                            </div>
                            <div>
                                <span style={{ color: '#cbd5e0', fontWeight: 'bold' }}>Miejsca pokoje:</span>
                                <p style={{ color: '#a0aec0' }}>{oferta.iloscMiejscPokoje}</p>
                            </div>
                        </div>
                    </div>

                    {/* Ośrodki */}
                    <div style={{
                        backgroundColor: '#2d3748',
                        padding: '24px',
                        borderRadius: '8px',
                        border: '1px solid #4a5568'
                    }}>
                        <h2 style={{ color: '#f7fafc', marginBottom: '16px' }}>🏨 Ośrodki</h2>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {oferta.osrodki.map((osrodek) => (
                                <div key={osrodek.idOsrodek} style={{
                                    backgroundColor: '#1a202c',
                                    padding: '16px',
                                    borderRadius: '6px',
                                    border: '1px solid #4a5568'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                                        <div>
                                            <h3 style={{ color: '#f7fafc', fontWeight: 'bold', fontSize: '18px' }}>{osrodek.nazwaOsrodka}</h3>
                                            {osrodek.adres && (
                                                <p style={{ color: '#a0aec0', fontSize: '14px' }}>{osrodek.adres}</p>
                                            )}
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#90cdf4' }}>
                                                {osrodek.cenaOs.toFixed(2)} zł
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#a0aec0' }}>za osobę</div>
                                        </div>
                                    </div>

                                    {osrodek.rodzajWyzywienia && (
                                        <div style={{ color: '#cbd5e0', marginBottom: '8px' }}>
                                            🍽️ {osrodek.rodzajWyzywienia}
                                        </div>
                                    )}

                                    {osrodek.opis && (
                                        <p style={{ color: '#a0aec0', fontSize: '14px', marginBottom: '8px' }}>{osrodek.opis}</p>
                                    )}

                                    {osrodek.adnotacje && (
                                        <p style={{ color: '#a0aec0', fontSize: '14px', fontStyle: 'italic' }}>{osrodek.adnotacje}</p>
                                    )}

                                    {/* Pokoje */}
                                    {osrodek.pokoje.length > 0 && (
                                        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #4a5568' }}>
                                            <h4 style={{ color: '#cbd5e0', fontWeight: 'bold', marginBottom: '8px' }}>
                                                Pokoje ({osrodek.pokoje.length}):
                                            </h4>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                                                {osrodek.pokoje.map((pokoj) => (
                                                    <div
                                                        key={pokoj.idPokoj}
                                                        style={{
                                                            fontSize: '13px',
                                                            padding: '8px',
                                                            borderRadius: '4px',
                                                            backgroundColor: pokoj.czyZajety ? 'rgba(252, 129, 129, 0.2)' : 'rgba(104, 211, 145, 0.2)',
                                                            color: pokoj.czyZajety ? '#fc8181' : '#68d391',
                                                            border: pokoj.czyZajety ? '1px solid rgba(252, 129, 129, 0.3)' : '1px solid rgba(104, 211, 145, 0.3)'
                                                        }}
                                                    >
                                                        {pokoj.numerPokoju || `Pokój ${pokoj.idPokoj}`} - {pokoj.rodzajPokoju}
                                                        {pokoj.iloscOsob && ` (${pokoj.iloscOsob} os.)`}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Dopłaty */}
                    {oferta.doplaty.length > 0 && (
                        <div style={{
                            backgroundColor: '#2d3748',
                            padding: '24px',
                            borderRadius: '8px',
                            border: '1px solid #4a5568'
                        }}>
                            <h2 style={{ color: '#f7fafc', marginBottom: '16px' }}>💰 Dopłaty</h2>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {oferta.doplaty.map((doplata) => (
                                    <div
                                        key={doplata.idDoplata}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '12px 0',
                                            borderBottom: '1px solid #4a5568'
                                        }}
                                    >
                                        <span style={{ color: '#cbd5e0' }}>{doplata.nazwaDoplaty}</span>
                                        <span style={{ color: '#f7fafc', fontWeight: 'bold' }}>
                                            {doplata.kwotaDoplaty.toFixed(2)} zł
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Prawa kolumna */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Transport */}
                    <div style={{
                        backgroundColor: '#2d3748',
                        padding: '24px',
                        borderRadius: '8px',
                        border: '1px solid #4a5568'
                    }}>
                        <h2 style={{ color: '#f7fafc', marginBottom: '16px' }}>🚌 Transport</h2>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {oferta.transporty.map((transport) => (
                                <div key={transport.idTransport} style={{
                                    backgroundColor: 'rgba(66, 153, 225, 0.1)',
                                    padding: '12px',
                                    borderRadius: '6px',
                                    border: '1px solid rgba(66, 153, 225, 0.2)'
                                }}>
                                    <div style={{ color: '#f7fafc', fontWeight: 'bold' }}>{transport.rodzajTransportu}</div>
                                    <div style={{ color: '#cbd5e0', fontSize: '14px' }}>
                                        Ilość miejsc: {transport.iloscMiejsc}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Miejsca odjazdu */}
                    {oferta.miejscaOdjazdu.length > 0 && (
                        <div style={{
                            backgroundColor: '#2d3748',
                            padding: '24px',
                            borderRadius: '8px',
                            border: '1px solid #4a5568'
                        }}>
                            <h2 style={{ color: '#f7fafc', marginBottom: '16px' }}>📍 Miejsca odjazdu</h2>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {oferta.miejscaOdjazdu.map((miejsce) => (
                                    <div key={miejsce.idMiejsce} style={{
                                        borderLeft: '3px solid #90cdf4',
                                        paddingLeft: '12px'
                                    }}>
                                        <div style={{ color: '#f7fafc', fontWeight: 'bold' }}>{miejsce.nazwaMiejsca}</div>
                                        {miejsce.adres && (
                                            <div style={{ color: '#cbd5e0', fontSize: '14px' }}>{miejsce.adres}</div>
                                        )}
                                        {miejsce.opis && (
                                            <div style={{ color: '#a0aec0', fontSize: '14px', fontStyle: 'italic' }}>{miejsce.opis}</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Galeria */}
                    <div style={{
                        backgroundColor: '#2d3748',
                        padding: '24px',
                        borderRadius: '8px',
                        border: '1px solid #4a5568'
                    }}>
                        <h2 style={{ color: '#f7fafc', marginBottom: '16px' }}>🖼️ Galeria</h2>
                        <button className="btn btn-secondary" style={{ width: '100%' }}>
                            Zobacz galerię
                        </button>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <ConfirmModal
                isOpen={showArchiveModal}
                title="Archiwizacja oferty"
                message={`Czy na pewno chcesz zarchiwizować ofertę "${oferta.nazwaHandlowa}"? Oferta nie będzie widoczna dla klientów, ale możesz ją przywrócić w dowolnym momencie.`}
                confirmText="Archiwizuj"
                cancelText="Anuluj"
                type="warning"
                onConfirm={handleArchive}
                onCancel={() => setShowArchiveModal(false)}
            />

            <ConfirmModal
                isOpen={showRestoreModal}
                title="Przywracanie oferty"
                message={`Czy chcesz przywrócić ofertę "${oferta.nazwaHandlowa}"? Oferta stanie się ponownie aktywna i widoczna dla klientów.`}
                confirmText="Przywróć"
                cancelText="Anuluj"
                type="info"
                onConfirm={handleRestore}
                onCancel={() => setShowRestoreModal(false)}
            />
        </div>
    );
};

export default OfertaDetailPage;
