using System;
using System.Collections.Generic;

namespace BiuroTurystyczne1.Data.Models;

public partial class Rozliczenie
{
    public uint IdRozliczenie { get; set; }

    public uint IdRezerwacja { get; set; }

    public decimal KwotaCalosciowa { get; set; }

    public decimal KwotaZaplacona { get; set; }

    public decimal? PozostaloDoPlatnosci { get; set; }

    public DateTime? DataUregulowania { get; set; }

    public string? StatusRozliczenia { get; set; }

    public virtual Rezerwacja IdRezerwacjaNavigation { get; set; } = null!;

    public virtual ICollection<Platnosc> Platnoscs { get; set; } = new List<Platnosc>();
}
