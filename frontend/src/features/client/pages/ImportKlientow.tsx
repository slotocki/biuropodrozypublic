import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import apiClient from '@/common/api/apiClient';
import { useNotification } from '@/common/context/NotificationContext';
import ReviewImport from './ReviewImport';
import styles from './ImportKlientow.module.css';
import baseStyles from '@/common/styles/KontrahentForm.module.css';
import type { Klient } from '@/common/types';

interface ParsedClient {
    imie: string;
    nazwisko: string;
    ulica: string;
    miejscowosc: string;
    telefon: string;
}

interface ImportData {
    clients: ParsedClient[];
    duplicates: ParsedClient[][];
}

const ImportKlientow: React.FC = () => {
    const { showToast } = useNotification();
    const [file, setFile] = useState<File | null>(null);
    const [importData, setImportData] = useState<ImportData | null>(null);
    const [loading, setLoading] = useState(false);

    const parseAddress = (fullAddress: string): { ulica: string; miejscowosc: string } => {
        if (!fullAddress) return { ulica: '', miejscowosc: '' };

        const addressLower = fullAddress.trim();

        const cities = [
            'Kraków', 'Opole', 'Wrocław', 'Warszawa', 'Gdańsk', 'Poznań', 'Łódź', 'Szczecin',
            'Katowice', 'Gdynia', 'Toruń', 'Kielce', 'Białystok', 'Radom', 'Rzeszów',
            'Nowy Sącz', 'Chrzanów', 'Skawina', 'Wieliczka', 'Tarnów', 'Limanowa', 'Olkusz', 'Myślenice'
        ];

        for (const city of cities) {
            if (addressLower.startsWith(city.toLowerCase())) {
                const remaining = addressLower.substring(city.length).trim();
                return {
                    miejscowosc: city,
                    ulica: remaining
                };
            }
        }

        const parts = addressLower.split(/(?=ul\.|os\.|al\.)/);
        if (parts.length > 1) {
            return {
                miejscowosc: parts[0].trim(),
                ulica: parts.slice(1).join('').trim()
            };
        }

        return { ulica: addressLower, miejscowosc: '' };
    };

    const parsePhoneNumber = (phone: any): string => {
        if (!phone) return '';

        // Konwertuj na string
        let phoneStr = String(phone).trim();

        if (!phoneStr || phoneStr === 'undefined' || phoneStr === 'null') return '';

        // Usuń WSZYSTKIE znaki oprócz cyfr i plusa
        phoneStr = phoneStr.replace(/[^\d\+]/g, '');

        // Jeśli zaczyna się od 0, zamień na +48
        if (phoneStr.startsWith('0')) {
            phoneStr = '+48' + phoneStr.substring(1);
        }

        // Jeśli nie zaczyna się od + i ma 9 cyfr, dodaj +48
        if (!phoneStr.startsWith('+') && phoneStr.replace(/\D/g, '').length === 9) {
            phoneStr = '+48' + phoneStr;
        }


        return phoneStr;
    };


    const findDuplicates = (clients: ParsedClient[]): { unique: ParsedClient[]; duplicates: ParsedClient[][] } => {
        const groupsByKey = new Map<string, ParsedClient[]>();

        clients.forEach((client) => {
            // ✅ IGNORUJ telefon - duplikaty TYLKO po nazwisko + imie
            const key = `${client.nazwisko.toLowerCase()}|${client.imie.toLowerCase()}`;

            if (!groupsByKey.has(key)) {
                groupsByKey.set(key, []);
            }
            groupsByKey.get(key)!.push(client);
        });

        const duplicates = Array.from(groupsByKey.values()).filter(group => group.length > 1);
        const unique = Array.from(groupsByKey.values())
            .filter(group => group.length === 1)
            .map(group => group[0]);

        console.log('Duplikaty:', duplicates.map(d => `${d[0].nazwisko} ${d[0].imie} (${d.length})`)); // DEBUG

        return { unique, duplicates };
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
        }
    };

    const handleImport = async () => {
        if (!file) {
            showToast('Wybierz plik do importu', 'warning');
            return;
        }

        setLoading(true);

        try {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const workbook = XLSX.read(event.target?.result, { type: 'array' });
                    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                    const data = XLSX.utils.sheet_to_json<any>(worksheet, { header: 1 });

                    const parsedClients: ParsedClient[] = data
                        .slice(1)
                        .filter(row => row[0] && row[1])
                        .map(row => {
                            const [nazwisko, imie, fullAddress, phone] = row;
                            const { ulica, miejscowosc } = parseAddress(fullAddress || '');

                            return {
                                nazwisko: nazwisko.trim(),
                                imie: imie.trim(),
                                ulica,
                                miejscowosc,
                                telefon: parsePhoneNumber(phone || '')
                            };
                        });

                    const { unique, duplicates } = findDuplicates(parsedClients);

                    setImportData({
                        clients: unique,
                        duplicates
                    });

                    if (duplicates.length > 0) {
                        showToast(
                            `Znaleziono ${duplicates.length} grupy duplikatów. Przejrzyj przed importem.`,
                            'info'
                        );
                    }
                } catch (error) {
                    showToast('Błąd podczas parsowania pliku', 'error');
                    console.error(error);
                }
            };

            reader.readAsArrayBuffer(file);
        } catch (error) {
            showToast('Błąd podczas importu', 'error');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (importData) {
        return <ReviewImport importData={importData} onBack={() => setImportData(null)} />;
    }

    return (
        <div className={baseStyles.modalOverlay}>
            <div className={baseStyles.modalContent}>
                <h2>Import klientów z Excel</h2>

                <div className={baseStyles.formGroup}>
                    <label className={baseStyles.label}>
                        Wybierz plik Excel
                    </label>
                    <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleFileChange}
                        className={baseStyles.input}
                    />
                    <small style={{ color: '#a0aec0', marginTop: '0.5rem', display: 'block' }}>
                        Format: Nazwisko | Imię | Adres | Telefon
                    </small>
                </div>

                {file && (
                    <div className={styles.fileInfo}>
                        📄 Wybrany plik: <strong>{file.name}</strong>
                    </div>
                )}

                <div className={baseStyles.buttonContainer}>
                    <button
                        className="btn btn-secondary"
                        onClick={() => {
                            setFile(null);
                            window.history.back(); // ← DODAJ TĘ LINIĘ
                        }}
                    >
                        Anuluj
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleImport}
                        disabled={!file || loading}
                    >
                        {loading ? 'Przetwarzanie...' : 'Przetwórz plik'}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default ImportKlientow;
