import React, { useState } from 'react';
import styles from '@/components/KontrahentForm.module.css';
import '@/pages/PageStyles.css';
import type { Kontrahent } from '@/types';

interface Props {
    kontrahenci: Kontrahent[];
    onSelect: (kontrahent: Kontrahent) => void;
    onCancel: () => void;
    onAddNew: () => void;
}

const WybierzKontrahentaModal: React.FC<Props> = ({ kontrahenci, onSelect, onCancel, onAddNew }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredKontrahenci = kontrahenci.filter(k =>
        k.nazwaFirmy.toLowerCase().includes(searchTerm.toLowerCase()) ||
        k.nip?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent} style={{ maxWidth: '800px' }}>
                <header className="page-header" style={{ borderBottom: 'none', marginBottom: '1rem' }}>
                    <h3>Wybierz kontrahenta</h3>
                    <button className="btn btn-primary" onClick={onAddNew}>
                        Dodaj nowego
                    </button>
                </header>
                <input
                    type="text"
                    placeholder="Szukaj po nazwie lub NIP..."
                    className={styles.input}
                    style={{ marginBottom: '1rem' }}
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <table className="data-table">
                        <thead>
                        <tr>
                            <th>Nazwa Firmy</th>
                            <th>NIP</th>
                            <th>Akcja</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredKontrahenci.map(kontrahent => (
                            <tr key={kontrahent.idKontrahent}>
                                <td>{kontrahent.nazwaFirmy}</td>
                                <td>{kontrahent.nip || '---'}</td>
                                <td>
                                    <button className="btn btn-secondary" onClick={() => onSelect(kontrahent)}>
                                        Wybierz
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
                <div className={styles.buttonContainer}>
                    <button type="button" className="btn btn-secondary" onClick={onCancel}>Anuluj</button>
                </div>
            </div>
        </div>
    );
};

export default WybierzKontrahentaModal;