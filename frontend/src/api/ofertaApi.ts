import apiClient from './apiClient';

// Typ do obsługi słownika nazw handlowych
export interface NazwaHandlowaOption {
    idNazwaHandlowa: number;
    nazwa: string;
    opis?: string | null;
}

export interface OfertaSummary {
    idOferta: number;
    idNazwaHandlowa: number | null;
    nazwaHandlowa: string; // do wyświetlania
    idDestynacja: number;
    nazwaDestynacji?: string;
    terminOd: string;
    terminDo: string;
    cenaOd: number;
    wolneMiejsca: number;
    rodzajTransportu?: string;
    czyAktywna: boolean;
}

export interface OfertaDetail {
    idOferta: number;
    idNazwaHandlowa: number | null;
    nazwaHandlowa: string; // do wyświetlania
    opis?: string;
    idDestynacja: number;
    nazwaDestynacji?: string;
    terminOd: string;
    terminDo: string;
    dataZakwaterowania?: string;
    dataWykwaterowania?: string;
    iloscMiejscTransport: number;
    iloscMiejscPokoje: number;
    wolneMiejsca: number;
    iloscNoclegow: number;
    osrodki: OfertaOsrodek[];
    transporty: TransportOferta[];
    miejscaOdjazdu: MiejsceOdjazd[];
    doplaty: DoplataSummary[];
    czyAktywna: boolean;
}

export interface OfertaOsrodek {
    idOsrodek: number;
    nazwaOsrodka: string;
    adres?: string;
    cenaOs: number;
    rodzajWyzywienia?: string;
    opis?: string;
    adnotacje?: string;
    pokoje: PokojSummary[];
}

export interface PokojSummary {
    idPokoj: number;
    numerPokoju?: string;
    rodzajPokoju?: string;
    iloscOsob?: number;
    maxIloscOsob?: number;
    czyZajety: boolean;
}

export interface TransportOferta {
    idTransport: number;
    rodzajTransportu: string;
    iloscMiejsc: number;
}

export interface MiejsceOdjazd {
    idMiejsce: number;
    nazwaMiejsca: string;
    adres?: string;
    opis?: string;
}

export interface DoplataSummary {
    idDoplata: number;
    nazwaDoplaty: string;
    kwotaDoplaty: number;
}

export interface OfertaSearchParams {
    search?: string;
    idDestynacja?: number;
    terminOd?: string;
    terminDo?: string;
    cenaMax?: number;
    tylkoAktywne?: boolean;
    idNazwaHandlowa?: number;
}

export interface OfertaCreateDto {
    idNazwaHandlowa: number;
    opis?: string;
    idDestynacja: number;
    terminOd: string;
    terminDo: string;
    dataZakwaterowania?: string;
    dataWykwaterowania?: string;
    iloscMiejscTransport: number;
    osrodki: {
        idOsrodek: number;
        cenaOs: number;
        idPokoje: number[];
    }[];
    idTransporty: number[];
    idMiejscaOdjazdu: number[];
}

export interface OfertaUpdateDto extends OfertaCreateDto {
    idOferta: number;
}

export const ofertaApi = {
    getOferty: async (params?: OfertaSearchParams): Promise<OfertaSummary[]> => {
        const response = await apiClient.get<OfertaSummary[]>('/api/Oferta', { params });
        return response.data;
    },

    getOferta: async (id: number): Promise<OfertaDetail> => {
        const response = await apiClient.get<OfertaDetail>(`/api/Oferta/${id}`);
        return response.data;
    },

    createOferta: async (data: OfertaCreateDto): Promise<{ idOferta: number }> => {
        const response = await apiClient.post<{ idOferta: number }>('/api/Oferta', data);
        return response.data;
    },

    updateOferta: async (id: number, data: OfertaUpdateDto): Promise<void> => {
        await apiClient.put(`/api/Oferta/${id}`, data);
    },

    archiveOferta: async (id: number): Promise<void> => {
        await apiClient.delete(`/api/Oferta/${id}`);
    },

    restoreOferta: async (id: number): Promise<void> => {
        await apiClient.patch(`/api/Oferta/${id}/restore`);
    },

    getNazwyHandlowe: async (): Promise<NazwaHandlowaOption[]> => {
        const response = await apiClient.get('/api/SimpleDictionary/nazwahandlowa');
        return response.data;
    },
};

export default ofertaApi;
