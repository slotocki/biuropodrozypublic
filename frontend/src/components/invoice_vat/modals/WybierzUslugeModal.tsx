import React, { useState } from 'react';
import styles from '@/components/KontrahentForm.module.css';
import '@/pages/PageStyles.css';
import type { Usluga } from '@/types';


interface WybierzUslugeModalProps {
    uslugi: Usluga[];
    onSelect: (usluga: Usluga) => void;
    onCancel: () => void;
}

const WybierzUslugeModal: React.FC<WybierzUslugeModalProps> = ({ uslugi, onSelect, onCancel }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredUslugi = uslugi.filter(usluga =>
        usluga.nazwaUslugi.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent} style={{ maxWidth: '800px' }}>
                <header className="page-header" style={{ borderBottom: 'none', marginBottom: '1rem' }}>
                    <h3>Wybierz usługę</h3>
                </header>
                <input
                    type="text"
                    placeholder="Szukaj usługi..."
                    className={styles.input}
                    style={{ marginBottom: '1rem' }}
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    autoFocus
                />
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <table className="data-table">
                        <thead>
                        <tr>
                            <th>Nazwa Usługi</th>
                            <th>Cena netto</th>
                            <th>VAT (%)</th>
                            <th>Akcja</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredUslugi.length === 0 ? (
                            <tr>
                                <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: '#a0aec0' }}>
                                    Nie znaleziono usług
                                </td>
                            </tr>
                        ) : (
                            filteredUslugi.map(usluga => (
                                <tr key={usluga.idUsluga}>
                                    <td>{usluga.nazwaUslugi}</td>
                                    <td>{usluga.cenaNetto.toFixed(2)} zł</td>
                                    <td>{usluga.stawkaVat}%</td>
                                    <td>
                                        <button className="btn btn-secondary" onClick={() => onSelect(usluga)}>
                                            Wybierz
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>
                <div className={styles.buttonContainer}>
                    <p style={{ margin: 0, color: '#a0aec0', fontSize: '0.9rem' }}>
                        Wyświetlono {filteredUslugi.length} z {uslugi.length} usług
                    </p>
                    <button type="button" className="btn btn-secondary" onClick={onCancel}>Anuluj</button>
                </div>
            </div>
        </div>
    );
};

export default WybierzUslugeModal;
