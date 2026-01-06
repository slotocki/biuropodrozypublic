import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
type DateFilter = '' | 'today' | 'thisWeek' | 'lastWeek' | 'lastMonth' | 'lastYear';

const ROWS_OPTIONS = [10, 25, 50, 100];

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
    const [filterDate, setFilterDate] = useState<DateFilter>('');
    
    // Paginacja
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

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

    // Filtrowanie po dacie
    const getDateRange = (filter: DateFilter): { start: Date; end: Date } | null => {
        if (!filter) return null;
        
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        switch (filter) {
            case 'today':
                return { start: today, end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1) };
            case 'thisWeek': {
                const dayOfWeek = today.getDay();
                const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
                const monday = new Date(today.getTime() + mondayOffset * 24 * 60 * 60 * 1000);
                const sunday = new Date(monday.getTime() + 6 * 24 * 60 * 60 * 1000 + 24 * 60 * 60 * 1000 - 1);
                return { start: monday, end: sunday };
            }
            case 'lastWeek': {
                const dayOfWeek = today.getDay();
                const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
                const thisMonday = new Date(today.getTime() + mondayOffset * 24 * 60 * 60 * 1000);
                const lastMonday = new Date(thisMonday.getTime() - 7 * 24 * 60 * 60 * 1000);
                const lastSunday = new Date(lastMonday.getTime() + 6 * 24 * 60 * 60 * 1000 + 24 * 60 * 60 * 1000 - 1);
                return { start: lastMonday, end: lastSunday };
            }
            case 'lastMonth': {
                const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
                return { start: firstDayLastMonth, end: lastDayLastMonth };
            }
            case 'lastYear': {
                const firstDayLastYear = new Date(now.getFullYear() - 1, 0, 1);
                const lastDayLastYear = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);
                return { start: firstDayLastYear, end: lastDayLastYear };
            }
            default:
                return null;
        }
    };

    const filteredByDateFaktury = useMemo(() => {
        const dateRange = getDateRange(filterDate);
        if (!dateRange) return faktury;
        
        return faktury.filter(f => {
            const date = new Date(f.dataWystawienia);
            return date >= dateRange.start && date <= dateRange.end;
        });
    }, [faktury, filterDate]);

    const sortedFaktury = useMemo(() => {
        const sorted = [...filteredByDateFaktury].sort((a, b) => {
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
    }, [filteredByDateFaktury, sortField, sortOrder]);

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

    // Paginacja
    const paginatedFaktury = useMemo(() => {
        const start = (currentPage - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        return sortedFaktury.slice(start, end);
    }, [sortedFaktury, currentPage, rowsPerPage]);

    const totalPages = Math.ceil(sortedFaktury.length / rowsPerPage);

    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > totalPages) return;
        setCurrentPage(newPage);
    };

    const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setRowsPerPage(Number(e.target.value));
        setCurrentPage(1);
    };

    if (loading) return <p className="loading-text">Ładowanie faktur...</p>;
    if (error) return <p className="error-text">{error}</p>;

    return (
        <div className="page-container">
            <header className="page-header">
                <h1>Faktury VAT</h1>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    {/* Przyciski akcji - widoczne tylko gdy wybrano faktury */}
                    {selectedIds.length > 0 && (
                        <>
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
                            >
                                📧 Wyślij email ({selectedIds.length})
                            </button>
                            <button
                                className="btn btn-danger"
                                onClick={handleDelete}
                            >
                                🗑️ Usuń ({selectedIds.length})
                            </button>
                        </>
                    )}
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

            <div style={{
                marginTop: '1rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
                borderRadius: '8px',
                overflow: 'hidden'
            }}>
                <table style={{ 
                    width: '100%', 
                    borderCollapse: 'collapse',
                    backgroundColor: '#1e2533'
                }}>
                    <thead>
                        <tr style={{ backgroundColor: '#2d3748' }}>
                            <th style={{ 
                                width: '50px', 
                                padding: '0.75rem',
                                borderBottom: '1px solid #4a5568',
                                color: '#e2e8f0',
                                textAlign: 'left'
                            }}>
                                <input
                                    type="checkbox"
                                    onChange={(e) => toggleSelectAll(e.target.checked)}
                                    checked={selectedIds.length === paginatedFaktury.length && paginatedFaktury.length > 0}
                                />
                            </th>
                            <th
                                onClick={() => handleSort('numerFaktury')}
                                style={{ 
                                    cursor: 'pointer', 
                                    userSelect: 'none',
                                    padding: '0.75rem',
                                    borderBottom: '1px solid #4a5568',
                                    color: '#e2e8f0',
                                    textAlign: 'left',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                Numer{getSortIcon('numerFaktury')}
                            </th>
                            <th style={{ 
                                padding: '0.75rem',
                                borderBottom: '1px solid #4a5568',
                                color: '#e2e8f0',
                                textAlign: 'left',
                                whiteSpace: 'nowrap'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <span
                                        onClick={() => handleSort('dataWystawienia')}
                                        style={{ cursor: 'pointer', userSelect: 'none' }}
                                    >
                                        Data{getSortIcon('dataWystawienia')}
                                    </span>
                                    <select
                                        value={filterDate}
                                        onChange={(e) => { setFilterDate(e.target.value as DateFilter); setCurrentPage(1); }}
                                        onClick={(e) => e.stopPropagation()}
                                        style={{
                                            padding: '0.25rem 0.5rem',
                                            borderRadius: '4px',
                                            border: '1px solid #4a5568',
                                            backgroundColor: '#1a202c',
                                            color: '#fff',
                                            fontSize: '0.75rem',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <option value="">Wszystkie</option>
                                        <option value="today">Dziś</option>
                                        <option value="thisWeek">Ten tydzień</option>
                                        <option value="lastWeek">Poprzedni tydzień</option>
                                        <option value="lastMonth">Poprzedni miesiąc</option>
                                        <option value="lastYear">Poprzedni rok</option>
                                    </select>
                                </div>
                            </th>
                            <th style={{ 
                                padding: '0.75rem',
                                borderBottom: '1px solid #4a5568',
                                color: '#e2e8f0',
                                textAlign: 'left',
                                minWidth: '220px'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <span
                                        onClick={() => handleSort('nazwaKontrahenta')}
                                        style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
                                    >
                                        Kontrahent{getSortIcon('nazwaKontrahenta')}
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="🔍 Filtruj..."
                                        value={filterKontrahent}
                                        onChange={(e) => { setFilterKontrahent(e.target.value); setCurrentPage(1); }}
                                        onClick={(e) => e.stopPropagation()}
                                        style={{
                                            padding: '0.25rem 0.5rem',
                                            borderRadius: '4px',
                                            border: '1px solid #4a5568',
                                            backgroundColor: '#1a202c',
                                            color: '#fff',
                                            fontSize: '0.75rem',
                                            width: '120px'
                                        }}
                                    />
                                    {filterKontrahent && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setFilterKontrahent(''); setCurrentPage(1); }}
                                            style={{
                                                padding: '0.2rem 0.4rem',
                                                borderRadius: '4px',
                                                border: 'none',
                                                backgroundColor: '#4a5568',
                                                color: '#fff',
                                                cursor: 'pointer',
                                                fontSize: '0.7rem'
                                            }}
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            </th>
                            <th
                                onClick={() => handleSort('kwotaBrutto')}
                                style={{ 
                                    cursor: 'pointer', 
                                    userSelect: 'none',
                                    padding: '0.75rem',
                                    borderBottom: '1px solid #4a5568',
                                    color: '#e2e8f0',
                                    textAlign: 'left',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                Brutto{getSortIcon('kwotaBrutto')}
                            </th>
                            <th style={{ 
                                padding: '0.75rem',
                                borderBottom: '1px solid #4a5568',
                                color: '#e2e8f0',
                                textAlign: 'left',
                                whiteSpace: 'nowrap'
                            }}>Typ</th>
                            <th style={{ 
                                padding: '0.75rem',
                                borderBottom: '1px solid #4a5568',
                                color: '#e2e8f0',
                                textAlign: 'left',
                                whiteSpace: 'nowrap'
                            }}>Koryguje</th>
                        </tr>
                    </thead>
                    <tbody>
                    {paginatedFaktury.length === 0 ? (
                        <tr>
                            <td colSpan={7} style={{ 
                                padding: '2rem', 
                                textAlign: 'center', 
                                color: '#a0aec0' 
                            }}>
                                {filterKontrahent || filterDate ? 'Brak faktur dla podanych kryteriów.' : 'Brak wystawionych faktur.'}
                            </td>
                        </tr>
                    ) : (
                        paginatedFaktury.map((faktura, index) => {
                            const isKorekta = faktura.typDokumentu === 'KOREKTA';
                            const isSelected = selectedIds.includes(faktura.idFaktura);
                            const rowBg = isSelected 
                                ? '#4a5568' 
                                : isKorekta 
                                    ? 'rgba(239, 68, 68, 0.08)' 
                                    : index % 2 === 0 
                                        ? '#1e2533' 
                                        : '#252d3d';
                            return (
                                <tr
                                    key={faktura.idFaktura}
                                    style={{
                                        backgroundColor: rowBg,
                                        cursor: 'pointer',
                                        transition: 'background-color 0.15s ease'
                                    }}
                                    onClick={() => toggleSelect(faktura.idFaktura)}
                                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = '#3a4556'; }}
                                    onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = rowBg; }}
                                >
                                    <td style={{ padding: '0.6rem 0.75rem' }} onClick={(e) => e.stopPropagation()}>
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => toggleSelect(faktura.idFaktura)}
                                        />
                                    </td>
                                    <td style={{ padding: '0.6rem 0.75rem', color: '#e2e8f0' }}>{faktura.numerFaktury}</td>
                                    <td style={{ padding: '0.6rem 0.75rem', color: '#e2e8f0' }}>{new Date(faktura.dataWystawienia).toLocaleDateString()}</td>
                                    <td style={{ padding: '0.6rem 0.75rem', color: '#e2e8f0' }}>{faktura.nazwaKontrahenta}</td>
                                    <td style={{ padding: '0.6rem 0.75rem', color: faktura.kwotaBrutto < 0 ? '#ef4444' : '#e2e8f0' }}>
                                        {faktura.kwotaBrutto.toFixed(2)} zł
                                    </td>
                                    <td style={{ padding: '0.6rem 0.75rem' }}>
                                        <span style={{
                                            padding: '2px 8px',
                                            borderRadius: '4px',
                                            fontSize: '0.8em',
                                            backgroundColor: isKorekta ? '#fee2e2' : '#d1fae5',
                                            color: isKorekta ? '#dc2626' : '#059669'
                                        }}>
                                            {faktura.typDokumentu || 'FAKTURA'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.6rem 0.75rem' }}>
                                        {isKorekta && faktura.numerFakturyOryginalnej ? (
                                            <span style={{
                                                padding: '2px 8px',
                                                borderRadius: '4px',
                                                fontSize: '0.8em',
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
            </div>

            {/* Paginacja na dole */}
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginTop: '1rem',
                padding: '0.75rem 0',
                color: '#a0aec0',
                fontSize: '0.9rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>Pokaż</span>
                    <select
                        value={rowsPerPage}
                        onChange={handleRowsPerPageChange}
                        style={{
                            padding: '0.35rem 0.5rem',
                            borderRadius: '4px',
                            border: '1px solid #4a5568',
                            backgroundColor: '#2d3748',
                            color: '#fff',
                            fontSize: '0.85rem',
                            cursor: 'pointer'
                        }}
                    >
                        {ROWS_OPTIONS.map(option => (
                            <option key={option} value={option}>{option}</option>
                        ))}
                    </select>
                    <span>z {sortedFaktury.length} faktur</span>
                </div>
                
                {totalPages > 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button
                            onClick={() => handlePageChange(1)}
                            disabled={currentPage === 1}
                            style={{
                                padding: '0.4rem 0.6rem',
                                borderRadius: '4px',
                                border: 'none',
                                backgroundColor: currentPage === 1 ? '#374151' : '#4a5568',
                                color: currentPage === 1 ? '#6b7280' : '#fff',
                                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                fontSize: '0.85rem'
                            }}
                        >
                            ««
                        </button>
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            style={{
                                padding: '0.4rem 0.6rem',
                                borderRadius: '4px',
                                border: 'none',
                                backgroundColor: currentPage === 1 ? '#374151' : '#4a5568',
                                color: currentPage === 1 ? '#6b7280' : '#fff',
                                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                fontSize: '0.85rem'
                            }}
                        >
                            «
                        </button>
                        <span style={{ padding: '0 0.5rem', color: '#e2e8f0' }}>
                            Strona {currentPage} z {totalPages}
                        </span>
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            style={{
                                padding: '0.4rem 0.6rem',
                                borderRadius: '4px',
                                border: 'none',
                                backgroundColor: currentPage === totalPages ? '#374151' : '#4a5568',
                                color: currentPage === totalPages ? '#6b7280' : '#fff',
                                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                                fontSize: '0.85rem'
                            }}
                        >
                            »
                        </button>
                        <button
                            onClick={() => handlePageChange(totalPages)}
                            disabled={currentPage === totalPages}
                            style={{
                                padding: '0.4rem 0.6rem',
                                borderRadius: '4px',
                                border: 'none',
                                backgroundColor: currentPage === totalPages ? '#374151' : '#4a5568',
                                color: currentPage === totalPages ? '#6b7280' : '#fff',
                                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                                fontSize: '0.85rem'
                            }}
                        >
                            »»
                        </button>
                    </div>
                )}
            </div>

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
