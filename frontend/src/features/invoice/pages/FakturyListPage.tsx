import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '@/common/api/apiClient';
import { useNotification } from '@/common/context/NotificationContext';
import WyslijEmailModal from '@/features/invoice/components/modals/WyslijEmailModal';
import '@/common/styles/PageStyles.css';


interface Faktura {
    idFaktura: number;
    numerFaktury: string;
    dataWystawienia: string;
    kwotaBrutto: number;
    nazwaKontrahenta: string;
}

type SortField = 'numerFaktury' | 'dataWystawienia' | 'nazwaKontrahenta' | 'kwotaBrutto';
type SortOrder = 'asc' | 'desc';

const FakturyListPage = () => {
    const navigate = useNavigate();
    const { showToast, showConfirm } = useNotification();
    const [faktury, setFaktury] = useState<Faktura[]>([]);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [sortField, setSortField] = useState<SortField>('dataWystawienia');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

    // ⭐ POPRAWIONE: usunięto showToast z dependency array
    const fetchFaktury = useCallback(async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/api/fakturyvat');
            setFaktury(response.data);
        } catch (err) {
            setError('Nie udało się pobrać listy faktur.');
            showToast('Nie udało się pobrać listy faktur.', 'error');  // ⭐ DODANE
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);  // ⭐ Pusta tablica

    useEffect(() => {
        fetchFaktury();
    }, [fetchFaktury]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    const sortedFaktury = React.useMemo(() => {
        const sorted = [...faktury].sort((a, b) => {
            let aValue: any = a[sortField];
            let bValue: any = b[sortField];

            if (sortField === 'dataWystawienia') {
                aValue = new Date(aValue).getTime();
                bValue = new Date(bValue).getTime();
            }
            else if (sortField === 'kwotaBrutto') {
                aValue = Number(aValue);
                bValue = Number(bValue);
            }
            else if (sortField === 'numerFaktury') {
                const parseNumerFaktury = (numer: string) => {
                    const parts = numer.split('/');
                    if (parts.length >= 1) {
                        const liczba = parseInt(parts[0], 10);
                        return isNaN(liczba) ? 0 : liczba;
                    }
                    return 0;
                };

                aValue = parseNumerFaktury(aValue);
                bValue = parseNumerFaktury(bValue);
            }

            if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
        return sorted;
    }, [faktury, sortField, sortOrder]);

    const getSortIcon = (field: SortField) => {
        if (sortField !== field) return ' ⇅';
        return sortOrder === 'asc' ? ' ↑' : ' ↓';
    };

    const toggleSelect = (id: number) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = (checked: boolean) => {
        setSelectedIds(checked ? faktury.map(f => f.idFaktura) : []);
    };

    const openPdfInNewTab = async (idFaktura: number) => {
        try {
            const response = await apiClient.get(`/api/fakturyvat/${idFaktura}/pdf`, {
                responseType: 'blob',
            });

            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
            setTimeout(() => window.URL.revokeObjectURL(url), 60000);

            showToast('PDF został otwarty w nowej karcie', 'success');  // ⭐ DODANE
        } catch (err) {
            console.error('Błąd podczas otwierania PDF:', err);
            showToast('Nie udało się otworzyć faktury PDF', 'error');  // ⭐ ZMIENIONE z alert
        }
    };

    const handleViewPdf = () => {
        if (selectedIds.length === 0) {
            showToast('Wybierz fakturę do wyświetlenia', 'warning');  // ⭐ ZMIENIONE z alert
            return;
        }
        if (selectedIds.length > 1) {
            showToast('Wybierz tylko jedną fakturę do wyświetlenia', 'warning');  // ⭐ ZMIENIONE z alert
            return;
        }
        openPdfInNewTab(selectedIds[0]);
    };

    const handleEdit = () => {
        if (selectedIds.length === 0) {
            showToast('Wybierz fakturę do edycji', 'warning');
            return;
        }
        if (selectedIds.length > 1) {
            showToast('Wybierz tylko jedną fakturę do edycji', 'warning');
            return;
        }
        navigate(`/faktury/edytuj/${selectedIds[0]}`); // ⭐ Przekierowanie do edycji
    };


    // ⭐ POPRAWIONE: użycie showConfirm zamiast window.confirm
    const handleDelete = async () => {
        if (selectedIds.length === 0) {
            showToast('Wybierz faktury do usunięcia', 'warning');  // ⭐ ZMIENIONE z alert
            return;
        }

        const confirmMessage = selectedIds.length === 1
            ? 'Czy na pewno chcesz usunąć wybraną fakturę?'
            : `Czy na pewno chcesz usunąć wybrane faktury (${selectedIds.length})?`;

        // ⭐ ZMIENIONE: użycie showConfirm zamiast window.confirm
        const confirmed = await showConfirm('Potwierdzenie usunięcia', confirmMessage);

        if (!confirmed) return;

        try {
            // ⭐ POPRAWIONE: obsługa błędów dla każdej faktury osobno
            const deletePromises = selectedIds.map(async (id) => {
                try {
                    await apiClient.delete(`/api/fakturyvat/${id}`);
                    return { id, success: true };
                } catch (error: any) {
                    return {
                        id,
                        success: false,
                        message: error.response?.data?.message || 'Nieznany błąd'
                    };
                }
            });

            const results = await Promise.all(deletePromises);

            const failed = results.filter(r => !r.success);
            const succeeded = results.filter(r => r.success);

            if (succeeded.length > 0) {
                showToast(`Usunięto ${succeeded.length} faktur(y)`, 'success');  // ⭐ DODANE
            }

            if (failed.length > 0) {
                failed.forEach(f => {
                    showToast(f.message, 'error');  // ⭐ DODANE
                });
            }

            setSelectedIds([]);
            fetchFaktury();
        } catch (err) {
            console.error('Błąd podczas usuwania faktur:', err);
            showToast('Nie udało się usunąć faktur', 'error');  // ⭐ ZMIENIONE z alert
        }
    };

    if (loading) return <p className="loading-text">Ładowanie faktur...</p>;
    if (error) return <p className="error-text">{error}</p>;

    return (
        <div className="page-container">
            <header className="page-header">
                <h1>Faktury VAT</h1>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <button
                        className="btn btn-secondary"
                        onClick={handleViewPdf}
                        disabled={selectedIds.length !== 1}
                        style={{ opacity: selectedIds.length !== 1 ? 0.5 : 1 }}
                    >
                        📄 PDF
                    </button>
                    <button
                        className="btn btn-secondary"
                        onClick={handleEdit}
                        disabled={selectedIds.length !== 1}
                        style={{ opacity: selectedIds.length !== 1 ? 0.5 : 1 }}
                    >
                        ✏️ Edytuj
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={() => setShowEmailModal(true)}
                        disabled={selectedIds.length === 0}
                        style={{ opacity: selectedIds.length === 0 ? 0.5 : 1 }}
                    >
                        📧 Wyślij email ({selectedIds.length})
                    </button>
                    <button
                        className="btn btn-danger"
                        onClick={handleDelete}
                        disabled={selectedIds.length === 0}
                        style={{ opacity: selectedIds.length === 0 ? 0.5 : 1 }}
                    >
                        🗑️ Usuń ({selectedIds.length})
                    </button>
                    <Link to="/faktury/nowa" className="btn btn-primary">
                        ➕ Wystaw nową fakturę
                    </Link>
                </div>
            </header>

            <table className="data-table">
                <thead>
                <tr>
                    <th style={{ width: '50px' }}>
                        <input
                            type="checkbox"
                            onChange={(e) => toggleSelectAll(e.target.checked)}
                            checked={selectedIds.length === faktury.length && faktury.length > 0}
                        />
                    </th>
                    <th
                        onClick={() => handleSort('numerFaktury')}
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                    >
                        Numer Faktury{getSortIcon('numerFaktury')}
                    </th>
                    <th
                        onClick={() => handleSort('dataWystawienia')}
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                    >
                        Data Wystawienia{getSortIcon('dataWystawienia')}
                    </th>
                    <th
                        onClick={() => handleSort('nazwaKontrahenta')}
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                    >
                        Kontrahent{getSortIcon('nazwaKontrahenta')}
                    </th>
                    <th
                        onClick={() => handleSort('kwotaBrutto')}
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                    >
                        Kwota Brutto{getSortIcon('kwotaBrutto')}
                    </th>
                </tr>
                </thead>
                <tbody>
                {sortedFaktury.length === 0 ? (
                    <tr>
                        <td colSpan={5}>Brak wystawionych faktur.</td>
                    </tr>
                ) : (
                    sortedFaktury.map((faktura) => (
                        <tr
                            key={faktura.idFaktura}
                            style={{
                                backgroundColor: selectedIds.includes(faktura.idFaktura) ? '#4a5568' : 'transparent',
                                cursor: 'pointer'
                            }}
                            onClick={() => toggleSelect(faktura.idFaktura)}
                        >
                            <td onClick={(e) => e.stopPropagation()}>
                                <input
                                    type="checkbox"
                                    checked={selectedIds.includes(faktura.idFaktura)}
                                    onChange={() => toggleSelect(faktura.idFaktura)}
                                />
                            </td>
                            <td>{faktura.numerFaktury}</td>
                            <td>{new Date(faktura.dataWystawienia).toLocaleDateString()}</td>
                            <td>{faktura.nazwaKontrahenta}</td>
                            <td>{faktura.kwotaBrutto.toFixed(2)} zł</td>
                        </tr>
                    ))
                )}
                </tbody>
            </table>

            {showEmailModal && (
                <WyslijEmailModal
                    selectedFakturyIds={selectedIds}
                    onClose={() => setShowEmailModal(false)}
                    onSuccess={() => {
                        setSelectedIds([]);
                        fetchFaktury();
                        showToast('Email wysłany pomyślnie', 'success');  // ⭐ DODANE
                    }}
                />
            )}
        </div>
    );
};

export default FakturyListPage;
