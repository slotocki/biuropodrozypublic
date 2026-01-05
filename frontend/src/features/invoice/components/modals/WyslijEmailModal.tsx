import React, { useState, useEffect } from 'react';
import apiClient from '@/common/api/apiClient';
import { useNotification } from '@/common/context/NotificationContext';
import styles from '@/common/styles/KontrahentForm.module.css';

interface WyslijEmailModalProps {
    selectedFakturyIds: number[];
    onClose: () => void;
    onSuccess: () => void;
}

interface Kontrahent {
    idKontrahent: number;
    nazwaFirmy: string;
    nip: string;
    email: string;
}

interface FakturaInfo {
    idFaktura: number;
    numerFaktury: string;
    kwotaBrutto: number;
    idKontrahent: number;
}

const WyslijEmailModal: React.FC<WyslijEmailModalProps> = ({
                                                               selectedFakturyIds,
                                                               onClose,
                                                               onSuccess,
                                                           }) => {
    const { showToast } = useNotification();
    const [recipientEmail, setRecipientEmail] = useState('');
    const [subject, setSubject] = useState('Faktura prowizyjna');
    const [body, setBody] = useState('Dzień dobry,\n\nPrzesyłam fakturę prowizyjną.\n\nPozdrawiam');
    const [sendCopy, setSendCopy] = useState(false);
    const [loading, setLoading] = useState(false);
    const [kontrahenci, setKontrahenci] = useState<Kontrahent[]>([]);
    const [selectedKontrahent, setSelectedKontrahent] = useState<Kontrahent | null>(null);
    const [autoFilledEmail, setAutoFilledEmail] = useState(false);
    const [faktury, setFaktury] = useState<FakturaInfo[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAttachments, setShowAttachments] = useState(false); // ⭐ NOWE
    const [showKontrahentList, setShowKontrahentList] = useState(false); // ⭐ NOWE

    useEffect(() => {
        const fetchData = async () => {
            try {
                const kontrahenciResponse = await apiClient.get('/api/kontrahenci');
                setKontrahenci(kontrahenciResponse.data);

                if (selectedFakturyIds.length > 0) {
                    try {
                        const fakturaPromises = selectedFakturyIds.map(id =>
                            apiClient.get(`/api/fakturyvat/${id}`)
                        );
                        const fakturaResponses = await Promise.all(fakturaPromises);
                        const fetchedFaktury = fakturaResponses.map(res => res.data);

                        setFaktury(fetchedFaktury);

                        const kontrahentIds = fetchedFaktury.map((f: any) => f.idKontrahent);
                        const uniqueKontrahentIds = [...new Set(kontrahentIds)];

                        if (uniqueKontrahentIds.length === 1 && uniqueKontrahentIds[0]) {
                            const kontrahentId = uniqueKontrahentIds[0];
                            const kontrahent = kontrahenciResponse.data.find(
                                (k: Kontrahent) => k.idKontrahent === kontrahentId
                            );

                            if (kontrahent) {
                                setSelectedKontrahent(kontrahent);
                                if (kontrahent.email) {
                                    setRecipientEmail(kontrahent.email);
                                    setAutoFilledEmail(true);
                                }
                            }
                        }
                    } catch (error) {
                        console.error('❌ Błąd pobierania faktur:', error);
                    }
                }
            } catch (error) {
                console.error('❌ Błąd podczas pobierania danych:', error);
                showToast('Błąd podczas pobierania danych', 'error');
            }
        };
        fetchData();
    }, [selectedFakturyIds, showToast]);

    const handleSend = async (withCopy: boolean) => {
        if (!recipientEmail) {
            showToast('Podaj adres email odbiorcy', 'warning');
            return;
        }

        setLoading(true);
        try {
            await apiClient.post('/api/email/send-faktury', {
                idFaktury: selectedFakturyIds,
                recipientEmail,
                subject,
                body,
                sendCopyToId1: withCopy,
            });

            showToast('Email został wysłany pomyślnie!', 'success');
            onSuccess();
            onClose();
        } catch (error: any) {
            showToast('Błąd podczas wysyłania: ' + (error.response?.data?.message || error.message), 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectKontrahent = (kontrahent: Kontrahent) => {
        setSelectedKontrahent(kontrahent);
        setRecipientEmail(kontrahent.email);
        setAutoFilledEmail(false);
        setSearchTerm('');
        setShowKontrahentList(false);
    };

    const filteredKontrahenci = kontrahenci.filter(k =>
        k.nazwaFirmy.toLowerCase().includes(searchTerm.toLowerCase()) ||
        k.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        k.nip.includes(searchTerm)
    );

    const sumaBrutto = faktury.reduce((sum, f) => sum + f.kwotaBrutto, 0);

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
                <h2>Wyślij faktury emailem</h2>

                {/* ⭐ ROZWIJANE Podsumowanie faktur */}
                <div style={{
                    marginBottom: '1.5rem',
                    padding: '0.75rem',
                    background: '#2d3748',
                    borderRadius: '6px',
                    border: '1px solid #4a5568'
                }}>
                    <button
                        onClick={() => setShowAttachments(!showAttachments)}
                        style={{
                            width: '100%',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: 'transparent',
                            border: 'none',
                            color: '#63b3ed',
                            fontSize: '0.95rem',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            padding: 0
                        }}
                    >
                        <span>📎 Załączniki ({faktury.length})</span>
                        <span style={{ fontSize: '1.2rem' }}>{showAttachments ? '▼' : '▶'}</span>
                    </button>

                    {showAttachments && (
                        <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #4a5568' }}>
                            {faktury.map(f => (
                                <div key={f.idFaktura} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    padding: '0.35rem 0',
                                    color: '#e2e8f0',
                                    fontSize: '0.85rem'
                                }}>
                                    <span>{f.numerFaktury}</span>
                                    <span style={{ fontWeight: 'bold' }}>{f.kwotaBrutto.toFixed(2)} zł</span>
                                </div>
                            ))}
                            {faktury.length > 1 && (
                                <div style={{
                                    marginTop: '0.5rem',
                                    paddingTop: '0.5rem',
                                    borderTop: '1px solid #4a5568',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    fontWeight: 'bold',
                                    color: '#48bb78'
                                }}>
                                    <span>SUMA:</span>
                                    <span>{sumaBrutto.toFixed(2)} zł</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label}>Adres email odbiorcy:</label>
                    <input
                        type="email"
                        className={styles.input}
                        value={recipientEmail}
                        onChange={(e) => {
                            setRecipientEmail(e.target.value);
                            setAutoFilledEmail(false);
                        }}
                        placeholder="email@example.com"
                        style={{
                            borderColor: autoFilledEmail ? '#48bb78' : undefined,
                            borderWidth: autoFilledEmail ? '2px' : undefined,
                        }}
                    />
                    {autoFilledEmail && (
                        <small style={{ color: '#48bb78', display: 'block', marginTop: '0.5rem' }}>
                            ✓ Email automatycznie uzupełniony z danych kontrahenta
                        </small>
                    )}
                </div>

                {selectedKontrahent && (
                    <div style={{
                        padding: '0.75rem',
                        background: '#1a202c',
                        borderRadius: '4px',
                        border: '1px solid #4a5568',
                        marginTop: '0.25rem',
                        marginBottom: '1rem'
                    }}>
                        <div style={{ color: '#63b3ed', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                            📧 Wysyłka do:
                        </div>
                        <div style={{ color: '#e2e8f0', fontWeight: 'bold' }}>
                            {selectedKontrahent.nazwaFirmy}
                        </div>
                        <div style={{ color: '#a0aec0', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                            NIP: {selectedKontrahent.nip}
                        </div>
                    </div>
                )}

                {/* ⭐ DYNAMICZNA lista kontrahentów */}
                <div className={styles.formGroup} style={{ position: 'relative' }}>
                    <label className={styles.label}>Lub wybierz inny kontrahent:</label>
                    <input
                        type="text"
                        className={styles.input}
                        placeholder="🔍 Szukaj po nazwie, emailu lub NIP..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onFocus={() => setShowKontrahentList(true)}
                    />

                    {showKontrahentList && searchTerm && (
                        <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            maxHeight: '300px',
                            overflowY: 'auto',
                            background: '#2d3748',
                            border: '1px solid #4a5568',
                            borderRadius: '4px',
                            marginTop: '0.25rem',
                            zIndex: 1000,
                            boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
                        }}>
                            {filteredKontrahenci.length > 0 ? (
                                filteredKontrahenci.map(k => (
                                    <div
                                        key={k.idKontrahent}
                                        onClick={() => handleSelectKontrahent(k)}
                                        style={{
                                            padding: '0.75rem',
                                            cursor: 'pointer',
                                            borderBottom: '1px solid #4a5568',
                                            transition: 'background 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#374151'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <div style={{ fontWeight: 'bold', color: '#e2e8f0', marginBottom: '0.25rem' }}>
                                            {k.nazwaFirmy}
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: '#a0aec0' }}>
                                            {k.email} • NIP: {k.nip}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div style={{ padding: '0.75rem', color: '#fc8181', textAlign: 'center' }}>
                                    Nie znaleziono kontrahentów
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label}>Tytuł emaila:</label>
                    <input
                        type="text"
                        className={styles.input}
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label}>Treść emaila:</label>
                    <textarea
                        className={styles.input}
                        rows={6}
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        style={{ resize: 'vertical', fontFamily: 'inherit' }}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#a0aec0', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={sendCopy}
                            onChange={(e) => setSendCopy(e.target.checked)}
                            style={{ cursor: 'pointer' }}
                        />
                        <span>Wyślij kopię do kontrahenta ID=1</span>
                    </label>
                </div>

                <div className={styles.buttonContainer}>
                    <button className="btn btn-secondary" onClick={onClose} disabled={loading}>
                        Anuluj
                    </button>
                    <button className="btn btn-primary" onClick={() => handleSend(sendCopy)} disabled={loading}>
                        {loading ? 'Wysyłanie...' : '📧 Wyślij'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WyslijEmailModal;


