// pages/offer/TransportPage.tsx
import SimpleDictionaryPage from './SimpleDictionaryPage';

const TransportPage = () => (
    <SimpleDictionaryPage
        config={{
            entityType: 'transport',
            title: 'Transport',
            fields: [{ key: 'rodzajTransportu', label: 'Rodzaj transportu', required: true }],
            displayField: 'rodzajTransportu',
            idField: 'idTransport'
        }}
    />
);

export default TransportPage;
