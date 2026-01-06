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
    typDokumentu: string;
    oryginalnaFakturaId: number | null;
    numerFakturyOryginalnej: string | null;
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
    const [filterKontrahent, setFilterKontrahent] = useState('');

    const fetchFaktury = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filterKontrahent.trim()) {
                params.append('kontrahent', filterKontrahent.trim());
            }
            const url = `/api/fakturyvat${params.toString() ? '?' + params.toString() : ''}`;
            const response = await apiClient.get(url);
            setFaktury(response.data);
        } catch (err) {
            setError('Nie udało się pobrać listy faktur.');
            showToast('Nie udało się pobrać listy faktur.', 'error');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [filterKontrahent]);

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
            showToast('Wybierz fakturę', 'warning');
            return;
        }
        if (selectedIds.length > 1) {
            showToast('Wybierz tylko jedną fakturę', 'warning');
            return;
        }
        
        // Sprawdź czy wybrana faktura nie jest już korektą
        const selectedFaktura = faktury.find(f => f.idFaktura === selectedIds[0]);
        if (selectedFaktura?.typDokumentu === 'KOREKTA') {
            showToast('Nie można wystawić korekty do faktury korygującej', 'warning');
            return;
        }
        
        // Przekierowanie do tworzenia korekty
        navigate(`/faktury/korekta/${selectedIds[0]}`);
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
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    {/* Filtr po kontrahentach */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input
                            type="text"
                            placeholder="🔍 Filtruj po kontrahentach..."
                            value={filterKontrahent}
                            onChange={(e) => setFilterKontrahent(e.target.value)}
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: '6px',
                                border: '1px solid #4a5568',
                                backgroundColor: '#2d3748',
                                color: '#fff',
                                minWidth: '220px',
                                fontSize: '0.9rem'
                            }}
                        />
                        {filterKontrahent && (
                            <button
                                onClick={() => setFilterKontrahent('')}
                                style={{
                                    padding: '0.5rem 0.75rem',
                                    borderRadius: '6px',
                                    border: 'none',
                                    backgroundColor: '#4a5568',
                                    color: '#fff',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem'
                                }}
                                title="Wyczyść filtr"
                            >
                                ✕
                            </button>
                        )}
                    </div>
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
                        📝 Wystaw korektę
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
                    <Link 
                        to={`/raporty/${new Date().getFullYear()}/${new Date().getMonth() + 1}`} 
                        className="btn btn-secondary"
                        style={{ backgroundColor: '#667eea' }}
                    >
                        📊 Raport miesiąca
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
                    <th>Typ</th>
                    <th>Koryguje</th>
                </tr>
                </thead>
                <tbody>
                {sortedFaktury.length === 0 ? (
                    <tr>
                        <td colSpan={7}>{filterKontrahent ? 'Brak faktur dla podanego kontrahenta.' : 'Brak wystawionych faktur.'}</td>
                    </tr>
                ) : (
                    sortedFaktury.map((faktura) => {
                        const isKorekta = faktura.typDokumentu === 'KOREKTA';
                        return (
                            <tr
                                key={faktura.idFaktura}
                                style={{
                                    backgroundColor: selectedIds.includes(faktura.idFaktura) 
                                        ? '#4a5568' 
                                        : isKorekta 
                                            ? 'rgba(239, 68, 68, 0.1)' 
                                            : 'transparent',
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
                                <td style={{ color: faktura.kwotaBrutto < 0 ? '#ef4444' : 'inherit' }}>
                                    {faktura.kwotaBrutto.toFixed(2)} zł
                                </td>
                                <td>
                                    <span style={{
                                        padding: '2px 8px',
                                        borderRadius: '4px',
                                        fontSize: '0.85em',
                                        backgroundColor: isKorekta ? '#fee2e2' : '#d1fae5',
                                        color: isKorekta ? '#dc2626' : '#059669'
                                    }}>
                                        {faktura.typDokumentu || 'FAKTURA'}
                                    </span>
                                </td>
                                <td>
                                    {isKorekta && faktura.numerFakturyOryginalnej ? (
                                        <span style={{
                                            padding: '2px 8px',
                                            borderRadius: '4px',
                                            fontSize: '0.85em',
                                            backgroundColor: '#fef3c7',
                                            color: '#92400e'
                                        }}>
                                            {faktura.numerFakturyOryginalnej}
                                        </span>
                                    ) : (
                                        <span style={{ color: '#6b7280' }}>—</span>
                                    )}
                                </td>
                            </tr>
                        );
                    })
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
