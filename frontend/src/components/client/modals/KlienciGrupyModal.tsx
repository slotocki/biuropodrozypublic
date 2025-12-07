import React, { useState, useEffect } from 'react';
import apiClient from '@/api/apiClient';
import { useNotification } from '@/context/NotificationContext';
import styles from '@/components/KontrahentForm.module.css';
import '@/pages/PageStyles.css';
import type { Grupa, Klient } from '@/types';

interface KlienciGrupyModalProps {
    grupa: Grupa;
    onSave: () => void;
    onCancel: () => void;
}

const KlienciGrupyModal: React.FC<KlienciGrupyModalProps> = ({ grupa, onSave, onCancel }) => {
    const { showToast } = useNotification();
    const [allKlienci, setAllKlienci] = useState<Klient[]>([]);
    const [grupaKlienci, setGrupaKlienci] = useState<Klient[]>([]);
    const [selectedKlientId, setSelectedKlientId] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [grupa.idGrupa]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Pobierz wszystkich klientów
            const allResponse = await apiClient.get('/api/klienci');
            setAllKlienci(allResponse.data);

            // Pobierz klientów w grupie
            const grupaResponse = await apiClient.get(`/api/grupy/${grupa.idGrupa}`);
            setGrupaKlienci(grupaResponse.data.klienci || []);
        } catch (error) {
            showToast('Błąd podczas pobierania danych.', 'error');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Klienci niedodani do grupy
    const availableKlienci = allKlienci.filter(
        k => !grupaKlienci.some(gk => gk.idKlient === k.idKlient)
    ).filter(
        k => `${k.imie} ${k.nazwisko}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddKlient = async () => {
        if (!selectedKlientId) {
            showToast('Wybierz klienta.', 'warning');
            return;
        }

        try {
            await apiClient.post(`/api/grupy/${grupa.idGrupa}/klienci/${selectedKlientId}`);
            showToast('Klient dodany do grupy.', 'success');
            setSelectedKlientId(null);
            setSearchTerm('');
            await fetchData();
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Błąd podczas dodawania klienta.';
            showToast(msg, 'error');
        }
    };

    const handleRemoveKlient = async (klientId: number) => {
        try {
            await apiClient.delete(`/api/grupy/${grupa.idGrupa}/klienci/${klientId}`);
            showToast('Klient usunięty z grupy.', 'success');
            await fetchData();
        } catch (error) {
            showToast('Błąd podczas usuwania klienta.', 'error');
        }
    };

    if (loading) {
        return (
            <div className={styles.modalOverlay}>
                <div className={styles.modalContent}>
                    <p>Ładowanie...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.largeModalContent}>
                <h2>Dodaj klientów do grupy: {grupa.nazwaGrupy}</h2>

                {/* SEKCJA DODAWANIA */}
                <div style={{
                    background: '#2d3748',
                    padding: '1.5rem',
                    borderRadius: '6px',
                    marginBottom: '2rem',
                    border: '1px solid #4a5568'
                }}>
                    <h3 style={{ marginTop: 0, color: '#edf2f7' }}>Wyszukaj i dodaj klienta</h3>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ color: '#cbd5e0', display: 'block', marginBottom: '0.5rem' }}>
                            Szukaj klienta
                        </label>
                        <input
                            type="text"
                            placeholder="Wpisz imię lub nazwisko..."
                            className={styles.input}
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            style={{ marginBottom: '1rem' }}
                        />

                        {availableKlienci.length > 0 ? (
                            <div style={{
                                background: '#1a202c',
                                border: '1px solid #4a5568',
                                borderRadius: '4px',
                                maxHeight: '200px',
                                overflowY: 'auto'
                            }}>
                                {availableKlienci.map(klient => (
                                    <div
                                        key={klient.idKlient}
                                        style={{
                                            padding: '0.75rem 1rem',
                                            borderBottom: '1px solid #4a5568',
                                            cursor: 'pointer',
                                            background: selectedKlientId === klient.idKlient ? '#4a5568' : 'transparent',
                                            transition: 'background 0.2s'
                                        }}
                                        onClick={() => setSelectedKlientId(klient.idKlient)}
                                        onMouseEnter={e => e.currentTarget.style.background = '#4a5568'}
                                        onMouseLeave={e => e.currentTarget.style.background = selectedKlientId === klient.idKlient ? '#4a5568' : 'transparent'}
                                    >
                                        <strong>{klient.imie} {klient.nazwisko}</strong>
                                        <br />
                                        <span style={{ fontSize: '0.9rem', color: '#a0aec0' }}>
                                            {klient.telefon || 'Brak telefonu'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : searchTerm ? (
                            <p style={{ color: '#a0aec0', fontStyle: 'italic' }}>Brak wyników wyszukiwania.</p>
                        ) : (
                            <p style={{ color: '#a0aec0', fontStyle: 'italic' }}>Wszyscy dostępni klienci są już w grupie.</p>
                        )}
                    </div>

                    <button
                        className="btn btn-primary"
                        onClick={handleAddKlient}
                        disabled={!selectedKlientId}
                        style={{ width: '100%' }}
                    >
                        ➕ Dodaj wybranego klienta
                    </button>
                </div>

                {/* SEKCJA OBECNYCH KLIENTÓW */}
                <div>
                    <h3 style={{ color: '#edf2f7', marginBottom: '1rem' }}>
                        Klienci w grupie ({grupaKlienci.length})
                    </h3>

                    {grupaKlienci.length === 0 ? (
                        <p style={{ color: '#a0aec0', fontStyle: 'italic', textAlign: 'center', padding: '2rem' }}>
                            Brak klientów w tej grupie.
                        </p>
                    ) : (
                        <table className="data-table" style={{ width: '100%' }}>
                            <thead>
                            <tr>
                                <th>Lp.</th>
                                <th>Imię i nazwisko</th>
                                <th>Email</th>
                                <th>Telefon</th>
                                <th style={{ width: '100px' }}>Akcja</th>
                            </tr>
                            </thead>
                            <tbody>
                            {grupaKlienci.map((klient, idx) => (
                                <tr key={klient.idKlient}>
                                    <td>{idx + 1}</td>
                                    <td>{klient.imie} {klient.nazwisko}</td>
                                    <td>{klient.email || '---'}</td>
                                    <td>{klient.telefon || '---'}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        <button
                                            className="btn btn-sm btn-danger"
                                            onClick={() => handleRemoveKlient(klient.idKlient)}
                                        >
                                            🗑️ Usuń
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* PRZYCISKI NA DOLE */}
                <div className={styles.buttonContainer} style={{ marginTop: '2rem' }}>
                    <button type="button" className="btn btn-secondary" onClick={onCancel}>
                        Zamknij
                    </button>
                    <button type="button" className="btn btn-primary" onClick={onSave}>
                        ✓ Gotowe
                    </button>
                </div>
            </div>
        </div>
    );
};

export default KlienciGrupyModal;
