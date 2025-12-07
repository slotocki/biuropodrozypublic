using System;
using System.Collections.Generic;

namespace BiuroTurystyczne1.Data.Models;

public partial class Platnosc
{
    public uint IdPlatnosc { get; set; }

    public uint IdRezerwacja { get; set; }

    public uint IdRozliczenie { get; set; }

    public DateTime DataPlatnosci { get; set; }

    public decimal KwotaPlatnosci { get; set; }

    public string SposobPlatnosci { get; set; } = null!;

    public string StatusPlatnosci { get; set; } = null!;

    public string? IdUser { get; set; }

    public virtual Rezerwacja IdRezerwacjaNavigation { get; set; } = null!;

    public virtual Rozliczenie IdRozliczenieNavigation { get; set; } = null!;

    public virtual AspNetUser? IdUserNavigation { get; set; }
}
