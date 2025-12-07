// pages/offer/MiejsceOdjazduPage.tsx
import SimpleDictionaryPage from '@/pages/offer/SimpleDictionaryPage';

const MiejsceOdjazduPage = () => (
    <SimpleDictionaryPage
        config={{
            entityType: 'miejsce',
            title: 'Miejsca odjazdu',
            fields: [
                { key: 'nazwaMiejsca', label: 'Nazwa miejsca', required: true },
                { key: 'adres', label: 'Adres', required: false },
                { key: 'opis', label: 'Opis', required: false }
            ],
            displayField: 'nazwaMiejsca',
            idField: 'idMiejsce'
        }}
    />
);

export default MiejsceOdjazduPage;
