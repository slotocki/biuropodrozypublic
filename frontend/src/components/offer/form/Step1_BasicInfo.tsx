import React, { useEffect, useState } from "react";
import CreatableSelect from "react-select/creatable";
import ofertaApi from "@/api/ofertaApi";
import type { OfertaCreateDto, NazwaHandlowaOption } from "@/api/ofertaApi";
import apiClient from "@/api/apiClient";
import "@/components/offer/form/Step1_BasicInfo.module.css";

interface Step1Props {
    data: OfertaCreateDto;
    updateData: (data: Partial<OfertaCreateDto>) => void;
    onNext: () => void;
}

interface DestynacjaOption {
    idDestynacja: number;
    nazwa: string;
}

const Step1BasicInfo: React.FC<Step1Props> = ({ data, updateData, onNext }) => {
    const [nazwyHandlowe, setNazwyHandlowe] = useState<NazwaHandlowaOption[]>([]);
    const [destynacje, setDestynacje] = useState<DestynacjaOption[]>([]);
    const [validationError, setValidationError] = useState<string | null>(null);

    useEffect(() => {
        ofertaApi.getNazwyHandlowe().then(setNazwyHandlowe);
        apiClient.get("/api/SimpleDictionary/destynacja").then((res) => setDestynacje(res.data));
    }, []);

    // react-select options
    const handlowaOptions = nazwyHandlowe.map(nh => ({
        value: nh.idNazwaHandlowa,
        label: nh.nazwa
    }));
    const destynacjaOptions = destynacje.map(d => ({
        value: d.idDestynacja,
        label: d.nazwa
    }));

    const handleNazwaChange = async (option: any, actionMeta: any) => {
        if (!option) {
            updateData({ idNazwaHandlowa: undefined });
            return;
        }
        // Dodano nową nazwę
        if (option.__isNew__) {
            try {
                const res = await apiClient.post("/api/SimpleDictionary/nazwahandlowa", { nazwa: option.label });
                setNazwyHandlowe((list) => [
                    ...list,
                    { idNazwaHandlowa: res.data.idNazwaHandlowa, nazwa: res.data.nazwa, opis: res.data.opis ?? null }
                ]);
                updateData({ idNazwaHandlowa: res.data.idNazwaHandlowa });
            } catch {
                setValidationError("Nie udało się dodać nowej nazwy!");
            }
        } else {
            updateData({ idNazwaHandlowa: option.value });
        }
    };

    const handleDestynacjaChange = async (option: any, actionMeta: any) => {
        if (!option) {
            updateData({ idDestynacja: undefined });
            return;
        }
        if (option.__isNew__) {
            try {
                const res = await apiClient.post("/api/SimpleDictionary/destynacja", { nazwa: option.label });
                setDestynacje((list) => [...list, { idDestynacja: res.data.idDestynacja, nazwa: res.data.nazwa }]);
                updateData({ idDestynacja: res.data.idDestynacja });
            } catch {
                setValidationError("Nie udało się dodać nowej destynacji!");
            }
        } else {
            updateData({ idDestynacja: option.value });
        }
    };

    const handleNext = () => {
        setValidationError(null);
        if (
            !data.idNazwaHandlowa ||
            !data.idDestynacja ||
            !data.terminOd ||
            !data.terminDo ||
            !data.opis ||
            !data.dataZakwaterowania ||
            !data.dataWykwaterowania
        ) {
            setValidationError("Wypełnij wszystkie wymagane pola!");
            return;
        }
        if (
            data.dataZakwaterowania &&
            data.dataWykwaterowania &&
            new Date(data.dataWykwaterowania) <= new Date(data.dataZakwaterowania)
        ) {
            setValidationError("Data wykwaterowania musi być po zakwaterowaniu.");
            return;
        }
        onNext();
    };

    return (
        <div>
            <h2 style={{ color: "#f7fafc", marginBottom: "1.5rem" }}>Krok 1: Podstawowe informacje</h2>

            <div className="form-group">
                <label className="form-label">Nazwa handlowa *</label>
                <CreatableSelect
                    classNamePrefix="react-select"
                    isClearable
                    placeholder="Wpisz lub wybierz nazwę..."
                    value={handlowaOptions.find(opt => opt.value === data.idNazwaHandlowa) || null}
                    onChange={handleNazwaChange}
                    options={handlowaOptions}
                    formatCreateLabel={input => `Dodaj: "${input}"`}
                />
            </div>

            <div className="form-group">
                <label className="form-label">Opis *</label>
                <textarea
                    className="form-textarea"
                    value={data.opis}
                    onChange={e => updateData({ opis: e.target.value })}
                    placeholder="Opis oferty..."
                    rows={4}
                />
            </div>

            <div className="form-group">
                <label className="form-label">Destynacja *</label>
                <CreatableSelect
                    classNamePrefix="react-select"

                    isClearable
                    placeholder="Wpisz lub wybierz destynację..."
                    value={destynacjaOptions.find(opt => opt.value === data.idDestynacja) || null}
                    onChange={handleDestynacjaChange}
                    options={destynacjaOptions}
                    formatCreateLabel={input => `Dodaj: "${input}"`}
                />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group">
                    <label className="form-label">Termin od *</label>
                    <input
                        type="date"
                        className="form-input"
                        value={data.terminOd}
                        onChange={e => updateData({ terminOd: e.target.value })}
                    />
                </div>
                <div className="form-group">
                    <label className="form-label">Termin do *</label>
                    <input
                        type="date"
                        className="form-input"
                        value={data.terminDo}
                        onChange={e => updateData({ terminDo: e.target.value })}
                    />
                </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group">
                    <label className="form-label">Data zakwaterowania *</label>
                    <input
                        type="datetime-local"
                        className="form-input"
                        value={data.dataZakwaterowania}
                        onChange={e => updateData({ dataZakwaterowania: e.target.value })}
                    />
                </div>
                <div className="form-group">
                    <label className="form-label">Data wykwaterowania *</label>
                    <input
                        type="datetime-local"
                        className="form-input"
                        value={data.dataWykwaterowania}
                        onChange={e => updateData({ dataWykwaterowania: e.target.value })}
                    />
                </div>
            </div>
            {validationError && (
                <div style={{ color: "#fc8181", marginTop: "1rem", fontWeight: "bold" }}>
                    {validationError}
                </div>
            )}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "2rem" }}>
                <button onClick={handleNext} className="btn btn-primary">
                    Dalej →
                </button>
            </div>
        </div>
    );
};

export default Step1BasicInfo;
