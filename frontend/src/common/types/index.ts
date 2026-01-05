// Centralna definicja dla obiektu Kontrahent
export interface Kontrahent {
    idKontrahent: number;
    nazwaFirmy: string;
    nip: string | null;
    ulica: string | null;
    kodPocztowy: string | null;
    miejscowosc: string | null;
    email: string | null;
    numerTelefonu: string | null;
}

// Centralna definicja dla obiektu Usluga
export interface Usluga {
    idUsluga: number;
    nazwaUslugi: string;
    cenaNetto: number;
    stawkaVat: number;
}

// Centralna definicja dla obiektu PozycjaFaktury
export interface PozycjaFaktury {
    klucz: number; // Unikalny klucz dla Reacta, np. Date.now()
    idUsluga: number;
    nazwaUslugi: string;
    ilosc: number;
    cenaNetto: number;
    stawkaVat: number;
}


export interface Klient {
    idKlient: number;
    imie: string;
    nazwisko: string;
    ulica?: string;
    kodPocztowy?: string;
    miejscowosc?: string;
    email?: string;
    telefon?: string;
    idObywatelstwo?: number;
    dataUrodzenia?: string;
    adnotacje?: string;
    idGrupa?: number;
    nazwaGrupy?: string;
    obywatelstwo?: string;
    iloscWystapien?: number;
}

export interface Grupa {
    idGrupa: number;
    nazwaGrupy: string;
    opiekunGrupy?: string;
    telefonOpiekuna?: string;
    adnotacje?: string;
    iloscCzlonkow?: number;
    iloscWystapien?: number;
    klienci?: Klient[];
}

export interface Obywatelstwo {
    idObywatelstwo: number;
    nazwa: string;
}

export interface PostalCodeResult {
    success: boolean;
    miejscowosc?: string;
    ulica?: string;
    gmina?: string;
    powiat?: string;
    message?: string;
    locations?: LocationOption[];
}

export interface LocationOption {
    miejscowosc: string;
    ulica?: string;
    gmina?: string;
    powiat?: string;
}