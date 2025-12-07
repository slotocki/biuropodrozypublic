import React, { useState, useEffect } from 'react';
import apiClient from '@/api/apiClient';
import { useNotification } from '@/context/NotificationContext';
import styles from './NotatkiPanel.module.css';

interface Notatka {
    idNotatki: number;
    tytul: string;
    tresc: string;
    dataPojawienia: string;
    dataZnikniecia: string | null;
    autor: string;
}

const NotatkiPanel: React.FC = () => {
    const { showToast, showConfirm } = useNotification();
    const [notatki, setNotatki] = useState<Notatka[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [editingNotatka, setEditingNotatka] = useState<Notatka | null>(null);

    // ✅ Stan dla wybranej notatki do wyświetlenia w modalu
    const [viewingNotatka, setViewingNotatka] = useState<Notatka | null>(null);

    const [formData, setFormData] = useState({
        tytul: '',
        tresc: '',
        dataPojawienia: '',
        dataZnikniecia: ''
    });

    const fetchNotatki = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/api/notatki');
            setNotatki(response.data);
        } catch (error) {
            showToast('Błąd podczas pobierania notatek', 'error');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotatki();
    }, []);

    const handleAddNew = () => {
        setEditingNotatka(null);
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        setFormData({
            tytul: '',
            tresc: '',
            dataPojawienia: now.toISOString().slice(0, 16),
            dataZnikniecia: ''
        });
        setIsFormVisible(true);
    };

    // ✅ Edycja z modala podglądu
    const handleEditFromModal = () => {
        if (!viewingNotatka) return;
        setEditingNotatka(viewingNotatka);
        setFormData({
            tytul: viewingNotatka.tytul,
            tresc: viewingNotatka.tresc,
            dataPojawienia: new Date(viewingNotatka.dataPojawienia).toISOString().slice(0, 16),
            dataZnikniecia: viewingNotatka.dataZnikniecia
                ? new Date(viewingNotatka.dataZnikniecia).toISOString().slice(0, 16)
                : ''
        });
        setViewingNotatka(null);
        setIsFormVisible(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const dataPojawienia = new Date(formData.dataPojawienia);
        const dataZnikniecia = formData.dataZnikniecia ? new Date(formData.dataZnikniecia) : null;

        if (dataZnikniecia && dataZnikniecia <= dataPojawienia) {
            showToast('Data zniknięcia musi być późniejsza niż data pojawienia', 'warning');
            return;
        }
        if (dataZnikniecia && dataZnikniecia <= new Date()) {
            showToast('Data zniknięcia nie może być w przeszłości', 'warning');
            return;
        }

        try {
            const payload = {
                tytul: formData.tytul,
                tresc: formData.tresc,
                dataPojawienia: formData.dataPojawienia,
                dataZnikniecia: formData.dataZnikniecia || null
            };

            if (editingNotatka) {
                await apiClient.put(`/api/notatki/${editingNotatka.idNotatki}`, payload);
                showToast('Notatka zaktualizowana', 'success');
            } else {
                await apiClient.post('/api/notatki', payload);
                showToast('Notatka dodana', 'success');
            }

            setIsFormVisible(false);
            fetchNotatki();
        } catch (error) {
            showToast('Błąd podczas zapisywania notatki', 'error');
            console.error(error);
        }
    };

    // ✅ Usuwanie z modala podglądu
    const handleDeleteFromModal = async () => {
        if (!viewingNotatka) return;
        const confirmed = await showConfirm(
            'Potwierdzenie usunięcia',
            'Czy na pewno chcesz usunąć tę notatkę?'
        );
        if (confirmed) {
            try {
                await apiClient.delete(`/api/notatki/${viewingNotatka.idNotatki}`);
                showToast('Notatka usunięta', 'success');
                setViewingNotatka(null);
                fetchNotatki();
            } catch (error) {
                showToast('Błąd podczas usuwania notatki', 'error');
                console.error(error);
            }
        }
    };

    const handleBold = () => {
        const textarea = document.getElementById('tresc') as HTMLTextAreaElement;
        if (!textarea) return;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = formData.tresc.substring(start, end);
        if (!selectedText) {
            showToast('Zaznacz tekst do formatowania', 'info');
            return;
        }
        const newText =
            formData.tresc.substring(0, start) +
            `<strong>${selectedText}</strong>` +
            formData.tresc.substring(end);
        setFormData(prev => ({ ...prev, tresc: newText }));
    };

    const handleItalic = () => {
        const textarea = document.getElementById('tresc') as HTMLTextAreaElement;
        if (!textarea) return;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = formData.tresc.substring(start, end);
        if (!selectedText) {
            showToast('Zaznacz tekst do formatowania', 'info');
            return;
        }
        const newText =
            formData.tresc.substring(0, start) +
            `<em>${selectedText}</em>` +
            formData.tresc.substring(end);
        setFormData(prev => ({ ...prev, tresc: newText }));
    };

    if (loading) {
        return <div className={styles.loading}>Ładowanie notatek...</div>;
    }

    return (
        <section className={styles.section}>
            <div className={styles.header}>
                <h2>📝 Notatki</h2>
                <button className="btn btn-primary" onClick={handleAddNew}>
                    ➕ Dodaj notatkę
                </button>
            </div>

            {/* ✅ Modal podglądu notatki */}
            {viewingNotatka && (
                <div className={styles.modalOverlay} onClick={() => setViewingNotatka(null)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3>{viewingNotatka.tytul}</h3>
                            <button
                                className={styles.closeButton}
                                onClick={() => setViewingNotatka(null)}
                            >
                                ✕
                            </button>
                        </div>
                        <div
                            className={styles.modalBody}
                            dangerouslySetInnerHTML={{ __html: viewingNotatka.tresc }}
                        />
                        <div className={styles.modalFooter}>
                            <small>
                                {viewingNotatka.autor} • {new Date(viewingNotatka.dataPojawienia).toLocaleString()}
                                {viewingNotatka.dataZnikniecia && (
                                    <> • Wygasa: {new Date(viewingNotatka.dataZnikniecia).toLocaleString()}</>
                                )}
                            </small>
                        </div>
                        <div className={styles.modalActions}>
                            <button className="btn btn-secondary" onClick={handleEditFromModal}>
                                ✏️ Edytuj
                            </button>
                            <button className="btn btn-danger" onClick={handleDeleteFromModal}>
                                🗑️ Usuń
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal formularza */}
            {isFormVisible && (
                <div className={styles.modalOverlay} onClick={() => setIsFormVisible(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <form onSubmit={handleSubmit}>
                            <h3>{editingNotatka ? 'Edytuj notatkę' : 'Nowa notatka'}</h3>

                            <div className={styles.formGroup}>
                                <label>Tytuł:</label>
                                <input
                                    type="text"
                                    className={styles.input}
                                    value={formData.tytul}
                                    onChange={e => setFormData(prev => ({ ...prev, tytul: e.target.value }))}
                                    required
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Treść:</label>
                                <div className={styles.toolbar}>
                                    <button type="button" onClick={handleBold} title="Pogrubienie">
                                        <strong>B</strong>
                                    </button>
                                    <button type="button" onClick={handleItalic} title="Kursywa">
                                        <em>I</em>
                                    </button>
                                </div>
                                <textarea
                                    id="tresc"
                                    className={styles.textarea}
                                    rows={6}
                                    value={formData.tresc}
                                    onChange={e => setFormData(prev => ({ ...prev, tresc: e.target.value }))}
                                />
                            </div>

                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Data pojawienia:</label>
                                    <input
                                        type="datetime-local"
                                        className={styles.input}
                                        value={formData.dataPojawienia}
                                        onChange={e => setFormData(prev => ({ ...prev, dataPojawienia: e.target.value }))}
                                        required
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Data wygaśnięcia (opcjonalnie):</label>
                                    <input
                                        type="datetime-local"
                                        className={styles.input}
                                        value={formData.dataZnikniecia}
                                        onChange={e => setFormData(prev => ({ ...prev, dataZnikniecia: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div className={styles.buttonContainer}>
                                <button type="button" className="btn btn-secondary" onClick={() => setIsFormVisible(false)}>
                                    Anuluj
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Zapisz
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ✅ Grid notatek - tylko podgląd */}
            <div className={styles.notatkiGrid}>
                {notatki.length === 0 ? (
                    <p className={styles.empty}>Brak aktywnych notatek</p>
                ) : (
                    notatki.map(notatka => (
                        <div
                            key={notatka.idNotatki}
                            className={styles.noteCard}
                            onClick={() => setViewingNotatka(notatka)}
                        >
                            <h4>{notatka.tytul}</h4>
                            <div
                                className={styles.notePreview}
                                dangerouslySetInnerHTML={{
                                    __html: notatka.tresc.replace(/<[^>]*>/g, '').substring(0, 150) + '...'
                                }}
                            />
                            <div className={styles.noteFooter}>
                                <small>{notatka.autor}</small>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </section>
    );
};

export default NotatkiPanel;
