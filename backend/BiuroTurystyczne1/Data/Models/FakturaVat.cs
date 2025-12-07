using System;
using System.Collections.Generic;

namespace BiuroTurystyczne1.Data.Models;

public partial class FakturaVat
{
    public uint IdFaktura { get; set; }

    public uint IdKontrahent { get; set; }

    public string NumerFaktury { get; set; } = null!;

    public decimal KwotaNetto { get; set; }

    public decimal KwotaVat { get; set; }

    public decimal KwotaBrutto { get; set; }

    public decimal Zaplacono { get; set; }

    public DateOnly DataWystawienia { get; set; }

    public DateOnly? TerminPlatnosci { get; set; }

    public string? FormaPlatnosci { get; set; }

    public string? IdUser { get; set; }

    /// <summary>
    /// Ścieżka do zapisanego pliku PDF
    /// </summary>
    public string? SciezkaPdf { get; set; }

    public uint? OryginalnaFakturaId { get; set; }

    public int? Wersja { get; set; }

    public bool? CzyAnulowana { get; set; }

    public virtual ICollection<FakturaVatPozycja> FakturaVatPozycjas { get; set; } = new List<FakturaVatPozycja>();

    public virtual Kontrahent IdKontrahentNavigation { get; set; } = null!;

    public virtual AspNetUser? IdUserNavigation { get; set; }

    public virtual ICollection<FakturaVat> InverseOryginalnaFaktura { get; set; } = new List<FakturaVat>();

    public virtual FakturaVat? OryginalnaFaktura { get; set; }
}
