import React, { useState } from 'react';
import apiClient from '@/common/api/apiClient';
import { useNotification } from '@/common/context/NotificationContext';
import styles from './ImportKlientow.module.css';
import baseStyles from '@/common/styles/KontrahentForm.module.css';


interface ParsedClient {
    imie: string;
    nazwisko: string;
    ulica: string;
    miejscowosc: string;
    telefon: string;
}

interface EditableClient extends ParsedClient {
    id: string;
    selected: boolean;
}

interface ImportData {
    clients: ParsedClient[];
    duplicates: ParsedClient[][];
}

interface ReviewImportProps {
    importData: ImportData;
    onBack: () => void;
}

const ReviewImport: React.FC<ReviewImportProps> = ({ importData, onBack }) => {
    const { showToast } = useNotification();
    const [loading, setLoading] = useState(false);
    const [tab, setTab] = useState<'unique' | 'duplicates'>('unique');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editField, setEditField] = useState<'telefon' | 'ulica' | 'miejscowosc' | 'imie' | 'nazwisko' | null>(null);
    const [editValue, setEditValue] = useState('');

    const [uniqueClients, setUniqueClients] = useState<EditableClient[]>(() => {
        const dupIds = new Set<string>();
        importData.duplicates.forEach((group) => {
            dupIds.add(`${group[0].nazwisko}|${group[0].imie}`);
        });

        return importData.clients
            .filter(c => !dupIds.has(`${c.nazwisko}|${c.imie}`))
            .map((c, idx) => ({
                ...c,
                id: `unique-${idx}`,
                selected: true
            }));
    });

    const [duplicateClients, setDuplicateClients] = useState<EditableClient[]>(() => {
        return importData.duplicates
            .flatMap((group, groupIdx) =>
                group.map((client, clientIdx) => ({
                    ...client,
                    id: `dup-${groupIdx}-${clientIdx}`,
                    selected: clientIdx === 0
                }))
            );
    });

    const handleSelectUnique = (id: string) => {
        setUniqueClients(prev =>
            prev.map(c => c.id === id ? { ...c, selected: !c.selected } : c)
        );
    };

    const handleEditStart = (id: string, field: 'telefon' | 'ulica' | 'miejscowosc' | 'imie' | 'nazwisko', currentValue: string) => {
        setEditingId(id);
        setEditField(field);
        setEditValue(currentValue);
    };

    const handleEditSave = (id: string) => {
        if (id.startsWith('unique')) {
            setUniqueClients(prev =>
                prev.map(c =>
                    c.id === id && editField
                        ? { ...c, [editField]: editValue }
                        : c
                )
            );
        } else {
            setDuplicateClients(prev =>
                prev.map(c =>
                    c.id === id && editField
                        ? { ...c, [editField]: editValue }
                        : c
                )
            );
        }
        setEditingId(null);
        setEditField(null);
    };

    const renderEditableCell = (id: string, field: 'telefon' | 'ulica' | 'miejscowosc' | 'imie' | 'nazwisko', value: string) => (
        <>
            {editingId === id && editField === field ? (
                <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => handleEditSave(id)}
                    onKeyDown={(e) => e.key === 'Enter' && handleEditSave(id)}
                    autoFocus
                    style={{
                        width: '100%',
                        padding: '0.5rem',
                        background: '#1a202c',
                        color: '#edf2f7',
                        border: '1px solid #4299e1'
                    }}
                />
            ) : (
                <span
                    onClick={() => handleEditStart(id, field, value)}
                    style={{
                        cursor: 'pointer',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '2px',
                        display: 'block'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#4a5568'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                    {value || (field === 'telefon' ? '❌ Brak' : '')}
                </span>
            )}
        </>
    );

    const renderClientRow = (client: EditableClient) => (
        <tr
            key={client.id}
            style={{
                background: client.selected ? 'rgba(48, 160, 95, 0.15)' : 'transparent',
                transition: 'background 0.2s'
            }}
        >
            <td style={{ maxWidth: '30px' }}>
                <input
                    type="checkbox"
                    checked={client.selected}
                    onChange={() => handleSelectUnique(client.id)}
                    style={{ cursor: 'pointer' }}
                />
            </td>
            <td>{renderEditableCell(client.id, 'nazwisko', client.nazwisko)}</td>
            <td>{renderEditableCell(client.id, 'imie', client.imie)}</td>
            <td>{renderEditableCell(client.id, 'miejscowosc', client.miejscowosc)}</td>
            <td>{renderEditableCell(client.id, 'ulica', client.ulica)}</td>
            <td>{renderEditableCell(client.id, 'telefon', client.telefon)}</td>
        </tr>
    );

    const selectedCount = uniqueClients.filter(c => c.selected).length +
        duplicateClients.filter(c => c.selected).length;

    const handleImport = async () => {
        const selectedUnique = uniqueClients.filter(c => c.selected);
        const selectedDuplicates = duplicateClients.filter(c => c.selected);
        const clientsToImport = [...selectedUnique, ...selectedDuplicates];

        if (clientsToImport.length === 0) {
            showToast('Wybierz przynajmniej jednego klienta do importu', 'warning');
            return;
        }

        setLoading(true);

        try {
            const response = await apiClient.post('/api/klienci/import', {
                clients: clientsToImport.map(client => ({
                    imie: client.imie,
                    nazwisko: client.nazwisko,
                    ulica: client.ulica || '',
                    kodPocztowy: '',
                    miejscowosc: client.miejscowosc || '',
                    email: '',
                    telefon: client.telefon || '',
                    idObywatelstwo: 1,
                    dataUrodzenia: null,
                    adnotacje: '',
                    idGrupa: undefined
                }))
            });

            showToast(`Zaimportowano ${response.data.imported} klientów`, 'success');
            setTimeout(() => {
                window.location.href = '/klienci/lista';
            }, 1500);
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Błąd podczas importu';
            showToast(errorMessage, 'error');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={baseStyles.modalOverlay}>
            <div className={styles.largeModalContent}>
                <h2>Przegląd importu - klikaj pola by edytować</h2>

                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${tab === 'unique' ? styles.active : ''}`}
                        onClick={() => setTab('unique')}
                    >
                        ✓ Unikalne ({uniqueClients.filter(c => c.selected).length}/{uniqueClients.length})
                    </button>
                    <button
                        className={`${styles.tab} ${tab === 'duplicates' ? styles.active : ''}`}
                        onClick={() => setTab('duplicates')}
                    >
                        ⚠️ Duplikaty ({duplicateClients.filter(c => c.selected).length}/{duplicateClients.length})
                    </button>
                </div>

                {tab === 'unique' && (
                    <div className={styles.table}>
                        <table>
                            <thead>
                            <tr>
                                <th style={{ maxWidth: '30px' }}>
                                    <input
                                        type="checkbox"
                                        checked={uniqueClients.length > 0 && uniqueClients.every(c => c.selected)}
                                        onChange={(e) =>
                                            setUniqueClients(prev =>
                                                prev.map(c => ({ ...c, selected: e.target.checked }))
                                            )
                                        }
                                    />
                                </th>
                                <th>Nazwisko</th>
                                <th>Imię</th>
                                <th>Miejscowość</th>
                                <th>Ulica</th>
                                <th>Telefon</th>
                            </tr>
                            </thead>
                            <tbody>
                            {uniqueClients.map(client => renderClientRow(client))}
                            </tbody>
                        </table>
                    </div>
                )}

                {tab === 'duplicates' && (
                    <div className={styles.table}>
                        {duplicateClients.length === 0 ? (
                            <p style={{ color: '#a0aec0', textAlign: 'center', padding: '2rem' }}>
                                Brak duplikatów
                            </p>
                        ) : (
                            <table>
                                <thead>
                                <tr>
                                    <th style={{ maxWidth: '30px' }}>
                                        <input
                                            type="checkbox"
                                            checked={duplicateClients.length > 0 && duplicateClients.every(c => c.selected)}
                                            onChange={(e) =>
                                                setDuplicateClients(prev =>
                                                    prev.map(c => ({ ...c, selected: e.target.checked }))
                                                )
                                            }
                                        />
                                    </th>
                                    <th>Nazwisko</th>
                                    <th>Imię</th>
                                    <th>Miejscowość</th>
                                    <th>Ulica</th>
                                    <th>Telefon</th>
                                    <th style={{ maxWidth: '80px', textAlign: 'center' }}>Grupa</th>
                                </tr>
                                </thead>
                                <tbody>
                                {importData.duplicates.map((group, groupIdx) =>
                                    group.map((client, clientIdx) => {
                                        const id = `dup-${groupIdx}-${clientIdx}`;
                                        const dupClient = duplicateClients.find(c => c.id === id);
                                        const isSelected = dupClient?.selected || false;

                                        return (
                                            <tr
                                                key={id}
                                                style={{
                                                    background: isSelected ? 'rgba(48, 160, 95, 0.15)' : 'transparent',
                                                    transition: 'background 0.2s',
                                                    borderBottom: clientIdx === group.length - 1 ? '2px solid #f6ad55' : '1px solid #4a5568'
                                                }}
                                            >
                                                <td style={{ maxWidth: '30px' }}>
                                                    <input
                                                        type="radio"
                                                        name={`group-${groupIdx}`}
                                                        checked={isSelected}
                                                        onClick={() => {
                                                            setDuplicateClients(prev =>
                                                                prev.map(c =>
                                                                    c.id === id
                                                                        ? { ...c, selected: !c.selected } // ✅ Toggle
                                                                        : c
                                                                )
                                                            );
                                                        }}
                                                        onChange={() => {}}
                                                        style={{ cursor: 'pointer' }}
                                                    />
                                                </td>
                                                <td>
                                        <span
                                            onClick={() => handleEditStart(id, 'nazwisko', dupClient?.nazwisko || '')}
                                            style={{
                                                cursor: 'pointer',
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '2px',
                                                display: 'block'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = '#4a5568'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            {editingId === id && editField === 'nazwisko' ? (
                                                <input
                                                    type="text"
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    onBlur={() => handleEditSave(id)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleEditSave(id)}
                                                    autoFocus
                                                    style={{ padding: '0.5rem', background: '#1a202c', color: '#edf2f7', border: '1px solid #4299e1', width: '100%' }}
                                                />
                                            ) : (
                                                dupClient?.nazwisko
                                            )}
                                        </span>
                                                </td>
                                                <td>
                                        <span
                                            onClick={() => handleEditStart(id, 'imie', dupClient?.imie || '')}
                                            style={{
                                                cursor: 'pointer',
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '2px',
                                                display: 'block'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = '#4a5568'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            {editingId === id && editField === 'imie' ? (
                                                <input
                                                    type="text"
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    onBlur={() => handleEditSave(id)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleEditSave(id)}
                                                    autoFocus
                                                    style={{ padding: '0.5rem', background: '#1a202c', color: '#edf2f7', border: '1px solid #4299e1', width: '100%' }}
                                                />
                                            ) : (
                                                dupClient?.imie
                                            )}
                                        </span>
                                                </td>
                                                <td>
                                        <span
                                            onClick={() => handleEditStart(id, 'miejscowosc', dupClient?.miejscowosc || '')}
                                            style={{
                                                cursor: 'pointer',
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '2px',
                                                display: 'block'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = '#4a5568'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            {editingId === id && editField === 'miejscowosc' ? (
                                                <input
                                                    type="text"
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    onBlur={() => handleEditSave(id)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleEditSave(id)}
                                                    autoFocus
                                                    style={{ padding: '0.5rem', background: '#1a202c', color: '#edf2f7', border: '1px solid #4299e1', width: '100%' }}
                                                />
                                            ) : (
                                                dupClient?.miejscowosc
                                            )}
                                        </span>
                                                </td>
                                                <td>
                                        <span
                                            onClick={() => handleEditStart(id, 'ulica', dupClient?.ulica || '')}
                                            style={{
                                                cursor: 'pointer',
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '2px',
                                                display: 'block'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = '#4a5568'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            {editingId === id && editField === 'ulica' ? (
                                                <input
                                                    type="text"
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    onBlur={() => handleEditSave(id)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleEditSave(id)}
                                                    autoFocus
                                                    style={{ padding: '0.5rem', background: '#1a202c', color: '#edf2f7', border: '1px solid #4299e1', width: '100%' }}
                                                />
                                            ) : (
                                                dupClient?.ulica
                                            )}
                                        </span>
                                                </td>
                                                <td>
                                        <span
                                            onClick={() => handleEditStart(id, 'telefon', dupClient?.telefon || '')}
                                            style={{
                                                cursor: 'pointer',
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '2px',
                                                display: 'block'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = '#4a5568'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            {editingId === id && editField === 'telefon' ? (
                                                <input
                                                    type="text"
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    onBlur={() => handleEditSave(id)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleEditSave(id)}
                                                    autoFocus
                                                    style={{ padding: '0.5rem', background: '#1a202c', color: '#edf2f7', border: '1px solid #4299e1', width: '100%' }}
                                                />
                                            ) : (
                                                dupClient?.telefon || '❌ Brak'
                                            )}
                                        </span>
                                                </td>
                                                <td style={{ maxWidth: '80px', textAlign: 'center', fontSize: '0.8rem', color: '#cbd5e0' }}>
                                                    Gr. {groupIdx + 1}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}




                <div style={{
                    padding: '1rem',
                    background: '#2d3748',
                    borderRadius: '4px',
                    color: '#cbd5e0',
                    marginTop: '1rem'
                }}>
                    ✓ <strong style={{ color: '#30a05f' }}>Do importu: {selectedCount} klientów</strong>
                </div>

                <div className={baseStyles.buttonContainer}>
                    <button
                        className="btn btn-secondary"
                        onClick={onBack}
                        disabled={loading}
                    >
                        Cofnij
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleImport}
                        disabled={loading || selectedCount === 0}
                    >
                        {loading ? 'Importowanie...' : `Zaimportuj (${selectedCount})`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReviewImport;
