import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/common/api/apiClient';
import { useNotification } from '@/common/context/NotificationContext';
import '@/common/styles/PageStyles.css';

interface FirmSettings {
    nazwaFirmy: string;
    adres: string;
    nip: string;
    telefon: string;
    bank: string;
    numerKonta: string;
    miejsceWystawienia: string;
    emailKsiegowosci: string;
}

const UstawieniaFirmyPage = () => {
    const navigate = useNavigate();
    const { showToast } = useNotification();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<FirmSettings>({
        nazwaFirmy: '',
        adres: '',
        nip: '',
        telefon: '',
        bank: '',
        numerKonta: '',
        miejsceWystawienia: '',
        emailKsiegowosci: ''
    });

    const fetchSettings = useCallback(async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/api/admin/firm-settings');
            setSettings(response.data);
        } catch (error: any) {
            console.error('Błąd podczas pobierania ustawień:', error);
            if (error.response?.status === 403) {
                showToast('Brak uprawnień do wyświetlenia ustawień. Wymagana rola: Admin', 'error');
                navigate('/');
            } else {
                showToast('Nie udało się pobrać ustawień firmy', 'error');
            }
        } finally {
            setLoading(false);
        }
    }, [navigate, showToast]);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const handleChange = (field: keyof FirmSettings, value: string) => {
        setSettings(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!settings.nazwaFirmy.trim()) {
            showToast('Nazwa firmy jest wymagana', 'warning');
            return;
        }

        try {
            setSaving(true);
            await apiClient.put('/api/admin/firm-settings', settings);
            showToast('Ustawienia firmy zostały zapisane', 'success');
        } catch (error: any) {
            console.error('Błąd podczas zapisywania ustawień:', error);
            showToast(error.response?.data?.message || 'Błąd podczas zapisywania ustawień', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="page-container">
                <p className="loading-text">Ładowanie ustawień...</p>
            </div>
        );
    }

    return (
        <div className="page-container">
            <header className="page-header">
                <h1>⚙️ Ustawienia Firmy</h1>
                <button 
                    className="btn btn-secondary" 
                    onClick={() => navigate('/')}
                >
                    ← Powrót do panelu
                </button>
            </header>

            <div style={{
                backgroundColor: '#2d3748',
                borderRadius: '12px',
                padding: '2rem',
                maxWidth: '800px'
            }}>
                <p style={{ 
                    color: '#a0aec0', 
                    marginBottom: '1.5rem',
                    fontSize: '0.95rem'
                }}>
                    Dane wprowadzone poniżej będą widoczne na wszystkich wystawianych fakturach VAT oraz fakturach korygujących.
                </p>

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gap: '1.5rem' }}>
                        {/* Nazwa firmy */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ color: '#e2e8f0', fontWeight: 500 }}>
                                Nazwa firmy *
                            </label>
                            <input
                                type="text"
                                value={settings.nazwaFirmy}
                                onChange={(e) => handleChange('nazwaFirmy', e.target.value)}
                                placeholder="Nazwa firmy"
                                required
                                style={{
                                    padding: '0.75rem 1rem',
                                    borderRadius: '8px',
                                    border: '1px solid #4a5568',
                                    backgroundColor: '#1a202c',
                                    color: '#fff',
                                    fontSize: '1rem'
                                }}
                            />
                        </div>

                        {/* Adres */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ color: '#e2e8f0', fontWeight: 500 }}>
                                Adres
                            </label>
                            <input
                                type="text"
                                value={settings.adres}
                                onChange={(e) => handleChange('adres', e.target.value)}
                                placeholder="ul. Przykładowa 1, 00-000 Miasto"
                                style={{
                                    padding: '0.75rem 1rem',
                                    borderRadius: '8px',
                                    border: '1px solid #4a5568',
                                    backgroundColor: '#1a202c',
                                    color: '#fff',
                                    fontSize: '1rem'
                                }}
                            />
                        </div>

                        {/* NIP i Telefon w jednym wierszu */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ color: '#e2e8f0', fontWeight: 500 }}>
                                    NIP
                                </label>
                                <input
                                    type="text"
                                    value={settings.nip}
                                    onChange={(e) => handleChange('nip', e.target.value)}
                                    placeholder="000 000 00 00"
                                    style={{
                                        padding: '0.75rem 1rem',
                                        borderRadius: '8px',
                                        border: '1px solid #4a5568',
                                        backgroundColor: '#1a202c',
                                        color: '#fff',
                                        fontSize: '1rem'
                                    }}
                                />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ color: '#e2e8f0', fontWeight: 500 }}>
                                    Telefon
                                </label>
                                <input
                                    type="text"
                                    value={settings.telefon}
                                    onChange={(e) => handleChange('telefon', e.target.value)}
                                    placeholder="+48 000 000 000"
                                    style={{
                                        padding: '0.75rem 1rem',
                                        borderRadius: '8px',
                                        border: '1px solid #4a5568',
                                        backgroundColor: '#1a202c',
                                        color: '#fff',
                                        fontSize: '1rem'
                                    }}
                                />
                            </div>
                        </div>

                        {/* Bank */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ color: '#e2e8f0', fontWeight: 500 }}>
                                Nazwa banku
                            </label>
                            <input
                                type="text"
                                value={settings.bank}
                                onChange={(e) => handleChange('bank', e.target.value)}
                                placeholder="Nazwa banku"
                                style={{
                                    padding: '0.75rem 1rem',
                                    borderRadius: '8px',
                                    border: '1px solid #4a5568',
                                    backgroundColor: '#1a202c',
                                    color: '#fff',
                                    fontSize: '1rem'
                                }}
                            />
                        </div>

                        {/* Numer konta */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ color: '#e2e8f0', fontWeight: 500 }}>
                                Numer konta bankowego
                            </label>
                            <input
                                type="text"
                                value={settings.numerKonta}
                                onChange={(e) => handleChange('numerKonta', e.target.value)}
                                placeholder="00 0000 0000 0000 0000 0000 0000"
                                style={{
                                    padding: '0.75rem 1rem',
                                    borderRadius: '8px',
                                    border: '1px solid #4a5568',
                                    backgroundColor: '#1a202c',
                                    color: '#fff',
                                    fontSize: '1rem',
                                    fontFamily: 'monospace'
                                }}
                            />
                        </div>

                        {/* Miejsce wystawienia */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ color: '#e2e8f0', fontWeight: 500 }}>
                                Miejsce wystawienia faktur
                            </label>
                            <input
                                type="text"
                                value={settings.miejsceWystawienia}
                                onChange={(e) => handleChange('miejsceWystawienia', e.target.value)}
                                placeholder="Miasto"
                                style={{
                                    padding: '0.75rem 1rem',
                                    borderRadius: '8px',
                                    border: '1px solid #4a5568',
                                    backgroundColor: '#1a202c',
                                    color: '#fff',
                                    fontSize: '1rem'
                                }}
                            />
                        </div>

                        {/* Email księgowości */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ color: '#e2e8f0', fontWeight: 500 }}>
                                📧 Email księgowości (do wysyłki raportów)
                            </label>
                            <input
                                type="email"
                                value={settings.emailKsiegowosci}
                                onChange={(e) => handleChange('emailKsiegowosci', e.target.value)}
                                placeholder="ksiegowosc@firma.pl"
                                style={{
                                    padding: '0.75rem 1rem',
                                    borderRadius: '8px',
                                    border: '1px solid #4a5568',
                                    backgroundColor: '#1a202c',
                                    color: '#fff',
                                    fontSize: '1rem'
                                }}
                            />
                            <span style={{ fontSize: '0.85rem', color: '#718096' }}>
                                Na ten adres będą wysyłane raporty miesięczne
                            </span>
                        </div>
                    </div>

                    {/* Przyciski */}
                    <div style={{ 
                        display: 'flex', 
                        gap: '1rem', 
                        marginTop: '2rem',
                        paddingTop: '1.5rem',
                        borderTop: '1px solid #4a5568'
                    }}>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={saving}
                            style={{ 
                                padding: '0.75rem 2rem',
                                opacity: saving ? 0.7 : 1
                            }}
                        >
                            {saving ? '💾 Zapisywanie...' : '💾 Zapisz ustawienia'}
                        </button>
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={fetchSettings}
                            disabled={saving}
                        >
                            🔄 Przywróć zapisane
                        </button>
                    </div>
                </form>

                {/* Informacja o logo */}
                <div style={{
                    marginTop: '2rem',
                    padding: '1rem',
                    backgroundColor: '#1a202c',
                    borderRadius: '8px',
                    border: '1px solid #4a5568'
                }}>
                    <h4 style={{ color: '#e2e8f0', margin: '0 0 0.5rem 0' }}>
                        📷 Logo firmy
                    </h4>
                    <p style={{ color: '#a0aec0', margin: 0, fontSize: '0.9rem' }}>
                        Logo firmy widoczne na fakturach znajduje się w pliku <code style={{ 
                            backgroundColor: '#2d3748', 
                            padding: '2px 6px', 
                            borderRadius: '4px',
                            color: '#4299e1'
                        }}>Resources/logo.png</code> na serwerze.
                        Aby zmienić logo, podmień ten plik zachowując tę samą nazwę.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default UstawieniaFirmyPage;

