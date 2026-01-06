import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/common/api/apiClient';
import { useNotification } from '@/common/context/NotificationContext';
import '@/common/styles/PageStyles.css';

interface MiesiacOption {
    rok: number;
    miesiac: number;
    etykieta: string;
}

const RaportyListPage = () => {
    const navigate = useNavigate();
    const { showToast } = useNotification();
    const [loading, setLoading] = useState(true);
    const [miesiace, setMiesiace] = useState<MiesiacOption[]>([]);

    const fetchMiesiace = useCallback(async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/api/raporty/dostepne-miesiace');
            setMiesiace(response.data);
        } catch (error) {
            console.error('Błąd podczas pobierania miesięcy:', error);
            showToast('Nie udało się pobrać dostępnych okresów', 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchMiesiace();
    }, [fetchMiesiace]);

    const handleOpenReport = (rok: number, miesiac: number) => {
        navigate(`/admin/raporty/${rok}/${miesiac}`);
    };

    // Bieżący miesiąc
    const teraz = new Date();
    const biezacyRok = teraz.getFullYear();
    const biezacyMiesiac = teraz.getMonth() + 1;

    if (loading) {
        return (
            <div className="page-container">
                <p className="loading-text">Ładowanie dostępnych okresów...</p>
            </div>
        );
    }

    return (
        <div className="page-container">
            {/* Przycisk cofania NAD nagłówkiem */}
            <div style={{ marginBottom: '1rem' }}>
                <button 
                    className="btn btn-secondary" 
                    onClick={() => navigate('/admin')}
                    style={{ 
                        padding: '0.6rem 1.2rem',
                        borderRadius: '6px',
                        fontSize: '0.95rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    ← Panel administracyjny
                </button>
            </div>

            <header className="page-header">
                <h1 style={{ margin: 0 }}>📊 Raporty Miesięczne</h1>
                <button
                    className="btn btn-primary"
                    onClick={() => handleOpenReport(biezacyRok, biezacyMiesiac)}
                >
                    📅 Raport bieżącego miesiąca
                </button>
            </header>

            {/* Filtry roku */}
            <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ color: '#e2e8f0', marginBottom: '1rem' }}>Archiwum raportów</h3>
                
                {miesiace.length === 0 ? (
                    <div style={{
                        backgroundColor: '#2d3748',
                        borderRadius: '12px',
                        padding: '3rem',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📭</div>
                        <h3 style={{ color: '#a0aec0', margin: 0 }}>Brak danych</h3>
                        <p style={{ color: '#718096', marginTop: '0.5rem' }}>
                            Nie znaleziono żadnych faktur w systemie. Po wystawieniu pierwszych faktur pojawią się tu dostępne okresy raportowe.
                        </p>
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                        gap: '1rem'
                    }}>
                        {miesiace.map((m) => {
                            const isCurrent = m.rok === biezacyRok && m.miesiac === biezacyMiesiac;
                            return (
                                <div
                                    key={`${m.rok}-${m.miesiac}`}
                                    onClick={() => handleOpenReport(m.rok, m.miesiac)}
                                    style={{
                                        backgroundColor: isCurrent ? '#2c5282' : '#2d3748',
                                        borderRadius: '8px',
                                        padding: '1.5rem',
                                        cursor: 'pointer',
                                        border: isCurrent ? '2px solid #4299e1' : '1px solid #4a5568',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
                                    <div style={{ 
                                        fontSize: '0.9rem', 
                                        color: '#a0aec0',
                                        marginBottom: '0.25rem'
                                    }}>
                                        {m.rok}
                                    </div>
                                    <div style={{ 
                                        fontSize: '1.25rem', 
                                        fontWeight: 'bold',
                                        color: '#fff'
                                    }}>
                                        {m.etykieta.split(' ')[0]}
                                    </div>
                                    {isCurrent && (
                                        <span style={{
                                            display: 'inline-block',
                                            marginTop: '0.5rem',
                                            padding: '2px 8px',
                                            backgroundColor: '#4299e1',
                                            borderRadius: '4px',
                                            fontSize: '0.75rem',
                                            color: '#fff'
                                        }}>
                                            Bieżący
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RaportyListPage;

