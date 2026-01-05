import React, { useState, useEffect } from "react";
import Select from "react-select";
import apiClient from "@/api/apiClient";
import styles from "./OfertaSearchBar.module.css";

// Do obsługi modala kalendarza stwórz własny modal lub użyj dowolnego popularnego picker-a
interface DestOption { value: number; label: string; }

export const OfertaSearchBar: React.FC<{ onSearch: (params: any) => void }> = ({ onSearch }) => {
    const [destynacje, setDestynacje] = useState<DestOption[]>([]);
    const [selectedDest, setSelectedDest] = useState<DestOption | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [terminOd, setTerminOd] = useState("");
    const [terminDo, setTerminDo] = useState("");
    const [showKiedyModal, setShowKiedyModal] = useState(false);
    const [cenaMax, setCenaMax] = useState("");
    const [tylkoAktywne, setTylkoAktywne] = useState(true);

    useEffect(() => {
        apiClient.get("/api/SimpleDictionary/destynacja")
            .then(res => setDestynacje(res.data.map((d: any) => ({ value: d.idDestynacja, label: d.nazwa }))));
    }, []);

    const handleSearch = () => {
        onSearch({
            search: searchTerm || undefined,
            idDestynacja: selectedDest?.value,
            terminOd: terminOd || undefined,
            terminDo: terminDo || undefined,
            cenaMax: cenaMax ? parseFloat(cenaMax) : undefined,
            tylkoAktywne
        });
    };

    const handleReset = () => {
        setSearchTerm('');
        setSelectedDest(null);
        setTerminOd('');
        setTerminDo('');
        setCenaMax('');
        setTylkoAktywne(true);
        onSearch({ tylkoAktywne: true });
    };

    return (
        <>
            <div className={styles.ribbonDark}>
                <div className={styles.fieldWide}>
                    <label>Dokąd?</label>
                    <Select
                        classNamePrefix="react-select"
                        isClearable
                        placeholder="Wyszukaj lub wybierz destynację..."
                        value={selectedDest}
                        onChange={opt => setSelectedDest(opt as DestOption)}
                        options={destynacje}
                        styles={{
                            control: (base) => ({
                                ...base, background: "#232a36", color: "#e2e8f0", borderColor: "#475065",
                                minHeight: 42, fontSize: 16
                            }),
                            menu: (base) => ({ ...base, background: "#232a36", color: "#e2e8f0" }),
                            option: (base, state) => ({
                                ...base, background: state.isFocused ? "#394060" : "#232a36", color: "#e2e8f0"
                            }),
                            input: (base) => ({ ...base, color: "#e2e8f0" }),
                            singleValue: (base) => ({ ...base, color: "#e2e8f0" }),
                            placeholder: (base) => ({ ...base, color: "#8793ad" }),
                        }}
                    />
                </div>
                <div className={styles.field}>
                    <label>Kiedy?</label>
                    <button
                        className={styles.kiedyBtn}
                        onClick={() => setShowKiedyModal(true)}
                    >
                        {terminOd && terminDo
                            ? `${terminOd} - ${terminDo}`
                            : "Wybierz termin"}
                    </button>
                    {showKiedyModal && (
                        <div className={styles.modalOverlay} onClick={()=>setShowKiedyModal(false)}>
                            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                                <h3>Wybierz termin</h3>
                                <div style={{ display: "flex", gap: 12 }}>
                                    <input
                                        type="date"
                                        value={terminOd}
                                        onChange={e => setTerminOd(e.target.value)}
                                        className={styles.input}
                                    />
                                    <span style={{color: "#cbd5e0", padding:"0 4px"}}>–</span>
                                    <input
                                        type="date"
                                        value={terminDo}
                                        onChange={e => setTerminDo(e.target.value)}
                                        className={styles.input}
                                    />
                                </div>
                                <div style={{marginTop:24, textAlign:'right'}}>
                                    <button className={styles.clearBtn} style={{marginRight:"8px"}} onClick={() => {setTerminOd('');setTerminDo('')}}>Wyczyść</button>
                                    <button className={styles.searchBtn} onClick={()=>setShowKiedyModal(false)}>Wybierz</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <div className={styles.fieldWide}>
                    <label>Czego szukasz?</label>
                    <input
                        type="text"
                        value={searchTerm}
                        placeholder="np. Hotel, opis, ośrodek..."
                        onChange={e => setSearchTerm(e.target.value)}
                        className={styles.input}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    />
                </div>
                <div className={styles.fieldNarrow}>
                    <label>Cena max</label>
                    <input
                        type="number"
                        value={cenaMax}
                        placeholder="2000"
                        onChange={e => setCenaMax(e.target.value)}
                        className={styles.input}
                        min="0"
                    />
                </div>
                <button className={styles.searchBtn} onClick={handleSearch}>
                    SZUKAJ
                </button>
            </div>
            <div className={styles.ribbonFooterRight}>
                <label className={styles.checkboxLabel}>
                    <input
                        type="checkbox"
                        checked={tylkoAktywne}
                        onChange={e => setTylkoAktywne(e.target.checked)}
                    />
                    Tylko aktywne oferty
                </label>
                <button className={styles.clearBtn} onClick={handleReset}>Wyczyść</button>
            </div>

        </>
    );
};

export default OfertaSearchBar;
