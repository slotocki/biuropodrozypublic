// pages/offer/DestynacjaPage.tsx
import SimpleDictionaryPage from '@/pages/offer/SimpleDictionaryPage';

const DestynacjaPage = () => (
    <SimpleDictionaryPage
        config={{
            entityType: 'destynacja',
            title: 'Destynacje',
            fields: [{ key: 'nazwa', label: 'Nazwa', required: true }],
            displayField: 'nazwa',
            idField: 'idDestynacja'
        }}
    />
);

export default DestynacjaPage;
