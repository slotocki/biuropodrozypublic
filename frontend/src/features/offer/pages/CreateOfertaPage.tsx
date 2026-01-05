import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ofertaApi from '@/common/api/ofertaApi';
import type { OfertaCreateDto } from '@/common/api/ofertaApi';
import { useNotification } from '@/common/context/NotificationContext';
import '@/common/styles/PageStyles.css';
import Step1BasicInfo from '@/features/offer/components/form/Step1_BasicInfo';
import Step2OsrodkiPokoje from '@/features/offer/components/form/Step2_OsrodkiPokoje';
import Step3Transport from '@/features/offer/components/form/Step3_Transport';
import Step4Summary from '@/features/offer/components/form/Step4_Summary';

const CreateOfertaPage: React.FC = () => {
    const navigate = useNavigate();
    const { showToast } = useNotification();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Stan formularza: idNazwaHandlowa, nie nazwaHandlowa!
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
        setLoading(true);
        try {
            const response = await ofertaApi.createOferta(formData);
            showToast('Oferta została utworzona pomyślnie!', 'success');
            navigate(`/oferta/${response.idOferta}`);
        } catch (err: any) {
            console.error('Błąd podczas tworzenia oferty:', err);
            showToast(err.response?.data?.message || 'Nie udało się utworzyć oferty', 'error');
        } finally {
            setLoading(false);
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
                return <Step4Summary data={formData} onSubmit={handleSubmit} onPrev={handlePrev} loading={loading} />;
            default:
                return null;
        }
    };

    return (
        <div className="page-container">
            <header className="page-header">
                <div>
                    <button onClick={() => navigate('/oferta/lista')}
                            className="btn btn-secondary"
                            style={{ marginBottom: '1rem' }}>
                        ← Powrót
                    </button>
                    <h1>Nowa oferta</h1>
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

export default CreateOfertaPage;
