// components/offer/SimpleDictionaryPage.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import apiClient from '@/common/api/apiClient';
import { useNotification } from '@/common/context/NotificationContext';
import '@/common/styles/PageStyles.css';
import styles from './SimpleDictionaryPage.module.css';

interface DictionaryConfig {
    entityType: string;
    title: string;
    fields: { key: string; label: string; required: boolean }[];
    displayField: string;
    idField: string;
}

interface SimpleDictionaryPageProps {
    config: DictionaryConfig;
}

const SimpleDictionaryPage: React.FC<SimpleDictionaryPageProps> = ({ config }) => {
    const { showToast, showConfirm } = useNotification();
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [sortField, setSortField] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);

    const fetchItems = useCallback(async () => {
        setLoading(true);
        try {
            const response = await apiClient.get(`/api/SimpleDictionary/${config.entityType}`);
            setItems(response.data);
        } catch (err) {
            showToast('Nie udało się pobrać danych.', 'error');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [config.entityType]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const handleAddNew = () => {
        setSelectedItem(null);
        setFormData({});
        setIsFormVisible(true);
    };

    const handleEdit = () => {
        if (selectedIds.length !== 1) {
            showToast('Zaznacz dokładnie jeden element do edycji.', 'warning');
            return;
        }
        const item = items.find(i => i[config.idField] === selectedIds[0]);
        if (item) {
            setSelectedItem(item);
            setFormData(item);
            setIsFormVisible(true);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (selectedItem) {
                await apiClient.put(
                    `/api/SimpleDictionary/${config.entityType}/${selectedItem[config.idField]}`,
                    formData
                );
                showToast('Zaktualizowano pomyślnie.', 'success');
            } else {
                await apiClient.post(`/api/SimpleDictionary/${config.entityType}`, formData);
                showToast('Dodano pomyślnie.', 'success');
            }
            setIsFormVisible(false);
            setSelectedIds([]);
            fetchItems();
        } catch (err: any) {
            showToast(err.response?.data?.message || 'Wystąpił błąd.', 'error');
        }
    };

    const handleDelete = async () => {
        if (selectedIds.length === 0) {
            showToast('Zaznacz elementy do usunięcia.', 'warning');
            return;
        }

        const confirmed = await showConfirm(
            'Potwierdzenie usunięcia',
            `Czy na pewno chcesz usunąć ${selectedIds.length} element(ów)?`
        );

        if (confirmed) {
            try {
                const deletePromises = selectedIds.map(async (id) => {
                    try {
                        await apiClient.delete(`/api/SimpleDictionary/${config.entityType}/${id}`);
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
                    showToast(`Usunięto ${succeeded.length} element(ów)`, 'success');
                }

                if (failed.length > 0) {
                    failed.forEach(f => {
                        showToast(f.message, 'error');
                    });
                }

                setSelectedIds([]);
                fetchItems();
            } catch (err) {
                showToast('Wystąpił nieoczekiwany błąd podczas usuwania.', 'error');
                console.error(err);
            }
        }
    };

    const handleRowClick = (id: number) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleSort = (field: string) => {
        if (sortField === field) {
            if (sortDirection === 'asc') {
                setSortDirection('desc');
            } else if (sortDirection === 'desc') {
                setSortField(null);
                setSortDirection(null);
            }
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const filteredAndSortedItems = useMemo(() => {
        let result = items.filter(item =>
            item[config.displayField]?.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (sortField && sortDirection) {
            result.sort((a, b) => {
                const aVal = a[sortField] || '';
                const bVal = b[sortField] || '';

                if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [items, searchTerm, sortField, sortDirection, config.displayField]);

    if (loading) return <p className="loading-text">Ładowanie...</p>;

    return (
        <div className="page-container">
            {isFormVisible && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <form onSubmit={handleSave} className={styles.form}>
                            <h2>{selectedItem ? 'Edytuj' : 'Dodaj nowy'}</h2>
                            {config.fields.map(field => (
                                <div className={styles.formGroup} key={field.key}>
                                    <label className={styles.label}>{field.label}</label>
                                    <input
                                        className={styles.input}
                                        type="text"
                                        value={formData[field.key] || ''}
                                        onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                                        required={field.required}
                                    />
                                </div>
                            ))}
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

            <header className="page-header">
                <h1>{config.title}</h1>
                <input
                    type="text"
                    placeholder="Szukaj..."
                    className="search-input"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </header>

            <div className="action-buttons">
                <button
                    className="btn btn-secondary"
                    onClick={handleEdit}
                    disabled={selectedIds.length !== 1}
                >
                    ✏️ Edytuj
                </button>
                <button
                    className="btn btn-danger"
                    onClick={handleDelete}
                    disabled={selectedIds.length === 0}
                >
                    🗑️ Usuń ({selectedIds.length})
                </button>
                <button
                    className="btn btn-primary"
                    onClick={handleAddNew}
                >
                    ➕ Dodaj
                </button>
            </div>

            <table className="data-table">
                <thead>
                <tr>
                    <th style={{ width: '40px' }}></th>
                    {config.fields.map(field => (
                        <th
                            key={field.key}
                            className={`sortable-header ${sortField === field.key ? `sorted-${sortDirection}` : ''}`}
                            onClick={() => handleSort(field.key)}
                        >
                            {field.label}
                        </th>
                    ))}
                </tr>
                </thead>
                <tbody>
                {filteredAndSortedItems.map((item) => {
                    const id = item[config.idField];
                    return (
                        <tr
                            key={id}
                            className={selectedIds.includes(id) ? 'selected-row' : ''}
                            onClick={() => handleRowClick(id)}
                            style={{ cursor: 'pointer' }}
                        >
                            <td>
                                <input
                                    type="checkbox"
                                    checked={selectedIds.includes(id)}
                                    onChange={() => {}}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </td>
                            {config.fields.map(field => (
                                <td key={field.key}>{item[field.key] || '---'}</td>
                            ))}
                        </tr>
                    );
                })}
                </tbody>
            </table>
        </div>
    );
};

export default SimpleDictionaryPage;
