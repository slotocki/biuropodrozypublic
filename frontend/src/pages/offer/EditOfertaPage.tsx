import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ofertaApi from '@/api/ofertaApi';
import type { OfertaCreateDto } from '@/api/ofertaApi';
import { useNotification } from '@/context/NotificationContext';
import '@/pages/PageStyles.css';
import Step1BasicInfo from '@/components/offer/form/Step1_BasicInfo';
import Step2OsrodkiPokoje from '@/components/offer/form/Step2_OsrodkiPokoje';
import Step3Transport from '@/components/offer/form/Step3_Transport';
import Step4Summary from '@/components/offer/form/Step4_Summary';

const EditOfertaPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { showToast } = useNotification();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState<OfertaCreateDto>({
        idNazwaHandlowa: 0,
        opis: '',
        idDestynacja: 0,
        terminOd: '',
        terminDo: '',
        dataZakwaterowania: '',
        dataWykwaterowania: '',
        iloscMiejscTransport: 0,
        osrodki: [],
        idTransporty: [],
        idMiejscaOdjazdu: [],
    });

    useEffect(() => {
        if (!id || isNaN(Number(id))) {
            showToast('Nieprawidłowe ID oferty', 'error');
            navigate('/oferta/lista');
            return;
        }
        loadOferta(Number(id));
    }, [id]);

    const loadOferta = async (idOferta: number) => {
        setLoading(true);
        try {
            const oferta = await ofertaApi.getOferta(idOferta);

            setFormData({
                idNazwaHandlowa: oferta.idNazwaHandlowa || 0,
                opis: oferta.opis || '',
                idDestynacja: oferta.idDestynacja,
                terminOd: oferta.terminOd,
                terminDo: oferta.terminDo,
                dataZakwaterowania: oferta.dataZakwaterowania || '',
                dataWykwaterowania: oferta.dataWykwaterowania || '',
                iloscMiejscTransport: oferta.iloscMiejscTransport,
                osrodki: oferta.osrodki.map(o => ({
                    idOsrodek: o.idOsrodek,
                    cenaOs: o.cenaOs,
                    idPokoje: o.pokoje.map(p => p.idPokoj)
                })),
                idTransporty: oferta.transporty.map(t => t.idTransport),
                idMiejscaOdjazdu: oferta.miejscaOdjazdu.map(m => m.idMiejsce),
            });
        } catch (err) {
            console.error('Błąd podczas ładowania oferty:', err);
            showToast('Nie udało się załadować oferty', 'error');
            navigate('/oferta/lista');
        } finally {
            setLoading(false);
        }
    };

    const updateFormData = (data: Partial<OfertaCreateDto>) => {
        setFormData(prev => ({ ...prev, ...data }));
    };

    const handleNext = () => {
        if (currentStep < 4) setCurrentStep(prev => prev + 1);
    };

    const handlePrev = () => {
        if (currentStep > 1) setCurrentStep(prev => prev - 1);
    };

    const handleSubmit = async () => {
        setSaving(true);
        try {
            await ofertaApi.updateOferta(Number(id), { ...formData, idOferta: Number(id) });
            showToast('Oferta została zaktualizowana pomyślnie!', 'success');
            navigate(`/oferta/szczegoly/${id}`);
        } catch (err: any) {
            console.error('Błąd podczas aktualizacji oferty:', err);
            showToast(err.response?.data?.message || 'Nie udało się zaktualizować oferty', 'error');
        } finally {
            setSaving(false);
        }
    };

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return <Step1BasicInfo data={formData} updateData={updateFormData} onNext={handleNext} />;
            case 2:
                return <Step2OsrodkiPokoje data={formData} updateData={updateFormData} onNext={handleNext} onPrev={handlePrev} />;
            case 3:
                return <Step3Transport data={formData} updateData={updateFormData} onNext={handleNext} onPrev={handlePrev} />;
            case 4:
                return <Step4Summary data={formData} onSubmit={handleSubmit} onPrev={handlePrev} loading={saving} />;
            default:
                return null;
        }
    };

    if (loading) {
        return (
            <div className="page-container">
                <p className="loading-text">Ładowanie oferty...</p>
            </div>
        );
    }

    return (
        <div className="page-container">
            <header className="page-header">
                <div>
                    <button onClick={() => navigate(`/oferta/szczegoly/${id}`)}
                            className="btn btn-secondary"
                            style={{ marginBottom: '1rem' }}>
                        ← Powrót
                    </button>
                    <h1>Edycja oferty</h1>
                    <p style={{ color: '#cbd5e0', marginTop: '0.5rem' }}>
                        {formData.idNazwaHandlowa ? `ID nazwy handlowej: ${formData.idNazwaHandlowa}` : ''}
                    </p>
                </div>
            </header>
            {/* Progress bar */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '2rem',
                padding: '0 2rem'
            }}>
                {[1, 2, 3, 4].map(step => (
                    <div key={step} style={{
                        flex: 1,
                        textAlign: 'center',
                        position: 'relative'
                    }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            backgroundColor: currentStep >= step ? '#4a5568' : '#2d3748',
                            color: currentStep >= step ? '#fff' : '#718096',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto',
                            fontWeight: 'bold',
                            border: currentStep === step ? '2px solid #90cdf4' : '2px solid transparent'
                        }}>
                            {step}
                        </div>
                        <div style={{
                            marginTop: '0.5rem',
                            fontSize: '0.85rem',
                            color: currentStep >= step ? '#cbd5e0' : '#718096'
                        }}>
                            {step === 1 && 'Podstawowe info'}
                            {step === 2 && 'Ośrodki i pokoje'}
                            {step === 3 && 'Transport'}
                            {step === 4 && 'Podsumowanie'}
                        </div>
                    </div>
                ))}
            </div>
            {/* Form content */}
            <div style={{
                backgroundColor: '#2d3748',
                padding: '2rem',
                borderRadius: '8px',
                border: '1px solid #4a5568'
            }}>
                {renderStep()}
            </div>
        </div>
    );
};

export default EditOfertaPage;
