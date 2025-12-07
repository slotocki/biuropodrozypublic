// pages/offer/WyzywieniePage.tsx
import SimpleDictionaryPage from '@/pages/offer/SimpleDictionaryPage';

const WyzywieniePage = () => (
    <SimpleDictionaryPage
        config={{
            entityType: 'wyzywienie',
            title: 'Wyżywienie',
            fields: [{ key: 'rodzajWyzywienia', label: 'Rodzaj wyżywienia', required: true }],
            displayField: 'rodzajWyzywienia',
            idField: 'idWyzywienie'
        }}
    />
);

export default WyzywieniePage;
