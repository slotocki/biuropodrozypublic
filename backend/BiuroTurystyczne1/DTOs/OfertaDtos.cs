// Data/DTOs/OfertaDtos.cs
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace BiuroTurystyczne1.Data.DTOs;

/// <summary>
/// DTO dla listy ofert (podsumowanie w tabeli)
/// </summary>
public class OfertaSummaryDto
{
    public uint IdOferta { get; set; }
    public uint? IdNazwaHandlowa { get; set; }     
    public string NazwaHandlowa { get; set; } = "";
    public uint IdDestynacja { get; set; }
    public string? NazwaDestynacji { get; set; }
    public DateOnly TerminOd { get; set; }
    public DateOnly TerminDo { get; set; }
    public decimal CenaOd { get; set; }
    public uint WolneMiejsca { get; set; }
    public string? RodzajTransportu { get; set; }
    public bool CzyAktywna { get; set; }
}

/// <summary>
/// DTO dla szczegółów pojedynczej oferty
/// </summary>
public class OfertaDetailDto
{
    public uint IdOferta { get; set; }
    public uint? IdNazwaHandlowa { get; set; }   
    public string NazwaHandlowa { get; set; } = "";
    public string? Opis { get; set; }
    public uint IdDestynacja { get; set; }
    public string? NazwaDestynacji { get; set; }
    public DateOnly TerminOd { get; set; }
    public DateOnly TerminDo { get; set; }
    public DateTime? DataZakwaterowania { get; set; }
    public DateTime? DataWykwaterowania { get; set; }
    public uint IloscMiejscTransport { get; set; }
    public uint IloscMiejscPokoje { get; set; }
    public uint WolneMiejsca { get; set; }
    public int IloscNoclegow { get; set; }
    public bool CzyAktywna { get; set; }
    
    public List<OfertaOsrodekDto> Osrodki { get; set; } = new();
    public List<TransportOfertaDto> Transporty { get; set; } = new();
    public List<MiejsceOdjazdDto> MiejscaOdjazdu { get; set; } = new();
    public List<DoplataSummaryDto> Doplaty { get; set; } = new();
}

/// <summary>
/// DTO dla ośrodka w ofercie
/// </summary>
public class OfertaOsrodekDto
{
    public uint IdOsrodek { get; set; }
    public string NazwaOsrodka { get; set; } = null!;
    public string? Adres { get; set; }
    public decimal CenaOs { get; set; }
    public string? RodzajWyzywienia { get; set; }
    public string? Opis { get; set; }
    public string? Adnotacje { get; set; }
    public List<PokojSummaryDto> Pokoje { get; set; } = new();
}

/// <summary>
/// DTO dla transportu w ofercie
/// </summary>
public class TransportOfertaDto
{
    public uint IdTransport { get; set; }
    public string RodzajTransportu { get; set; } = null!;
    public uint IloscMiejsc { get; set; }
}

/// <summary>
/// DTO dla miejsca odjazdu
/// </summary>
public class MiejsceOdjazdDto
{
    public uint IdMiejsce { get; set; }
    public string NazwaMiejsca { get; set; } = null!;
    public string? Adres { get; set; }
    public string? Opis { get; set; }
}

/// <summary>
/// DTO dla dopłaty (skrócone)
/// </summary>
public class DoplataSummaryDto
{
    public uint IdDoplata { get; set; }
    public string NazwaDoplaty { get; set; } = null!;
    public decimal KwotaDoplaty { get; set; }
}

/// <summary>
/// DTO dla pokoju (skrócone)
/// </summary>
public class PokojSummaryDto
{
    public uint IdPokoj { get; set; }
    public string? NumerPokoju { get; set; }
    public string? RodzajPokoju { get; set; }
    public byte? IloscOsob { get; set; }
    public byte? MaxIloscOsob { get; set; }
    public bool CzyZajety { get; set; }
}

/// <summary>
/// DTO do tworzenia nowej oferty
/// </summary>
public class OfertaCreateDto
{
    [Required(ErrorMessage = "Nazwa handlowa jest wymagana")]
    public uint IdNazwaHandlowa { get; set; }  // ✅ USUŃ [MaxLength]

    public string? Opis { get; set; }

    [Required(ErrorMessage = "Destynacja jest wymagana")]
    public uint IdDestynacja { get; set; }

    [Required(ErrorMessage = "Termin od jest wymagany")]
    public DateOnly TerminOd { get; set; }

    [Required(ErrorMessage = "Termin do jest wymagany")]
    public DateOnly TerminDo { get; set; }

    public DateTime? DataZakwaterowania { get; set; }
    public DateTime? DataWykwaterowania { get; set; }

    [Required(ErrorMessage = "Ilość miejsc w transporcie jest wymagana")]
    [Range(1, 10000, ErrorMessage = "Ilość miejsc musi być między 1 a 10000")]
    public uint IloscMiejscTransport { get; set; }

    [Required(ErrorMessage = "Wymagany jest przynajmniej jeden ośrodek")]
    public List<OfertaOsrodekCreateDto> Osrodki { get; set; } = new();

    [Required(ErrorMessage = "Wymagany jest przynajmniej jeden transport")]
    public List<uint> IdTransporty { get; set; } = new();

    public List<uint> IdMiejscaOdjazdu { get; set; } = new();
}

/// <summary>
/// DTO do dodawania ośrodka w ofercie
/// </summary>
public class OfertaOsrodekCreateDto
{
    [Required]
    public uint IdOsrodek { get; set; }

    [Required]
    [Range(0.01, 999999.99, ErrorMessage = "Cena musi być większa niż 0")]
    public decimal CenaOs { get; set; }

    [Required(ErrorMessage = "Wymagany jest przynajmniej jeden pokój")]
    public List<uint> IdPokoje { get; set; } = new();
}

/// <summary>
/// DTO do aktualizacji oferty
/// </summary>
public class OfertaUpdateDto
{
    [Required]
    public uint IdOferta { get; set; }

    [Required(ErrorMessage = "Nazwa handlowa jest wymagana")]
    public uint IdNazwaHandlowa { get; set; }  // ✅ USUŃ [MaxLength]

    public string? Opis { get; set; }

    [Required(ErrorMessage = "Destynacja jest wymagana")]
    public uint IdDestynacja { get; set; }

    [Required(ErrorMessage = "Termin od jest wymagany")]
    public DateOnly TerminOd { get; set; }

    [Required(ErrorMessage = "Termin do jest wymagany")]
    public DateOnly TerminDo { get; set; }

    public DateTime? DataZakwaterowania { get; set; }
    public DateTime? DataWykwaterowania { get; set; }

    [Required]
    [Range(1, 10000, ErrorMessage = "Ilość miejsc musi być między 1 a 10000")]
    public uint IloscMiejscTransport { get; set; }

    public List<OfertaOsrodekCreateDto> Osrodki { get; set; } = new();
    public List<uint> IdTransporty { get; set; } = new();
    public List<uint> IdMiejscaOdjazdu { get; set; } = new();
}

/// <summary>
/// DTO dla parametrów wyszukiwania
/// </summary>
public class OfertaSearchDto
{
    public string? Search { get; set; }
    public uint? IdDestynacja { get; set; }
    public DateOnly? TerminOd { get; set; }
    public DateOnly? TerminDo { get; set; }
    public decimal? CenaMax { get; set; }
    public bool TylkoAktywne { get; set; } = true;
}
