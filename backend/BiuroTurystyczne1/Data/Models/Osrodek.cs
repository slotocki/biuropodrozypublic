using System;
using System.Collections.Generic;

namespace BiuroTurystyczne1.Data.Models;

public partial class Osrodek
{
    public uint IdOsrodek { get; set; }

    public string NazwaOsrodka { get; set; } = null!;

    public uint IdDestynacja { get; set; }

    public uint IdWyzywienie { get; set; }

    public string? Opis { get; set; }

    public string? Ulica { get; set; }

    public string? KodPocztowy { get; set; }

    public string? Miejscowosc { get; set; }

    public string? Adnotacje { get; set; }

    public virtual Destynacja IdDestynacjaNavigation { get; set; } = null!;

    public virtual Wyzywienie IdWyzywienieNavigation { get; set; } = null!;

    public virtual ICollection<OfertaOsrodek> OfertaOsrodeks { get; set; } = new List<OfertaOsrodek>();

    public virtual ICollection<Pokoj> Pokojs { get; set; } = new List<Pokoj>();

    public virtual ICollection<Zdjecium> Zdjecia { get; set; } = new List<Zdjecium>();

    public virtual ICollection<Doplatum> IdDoplata { get; set; } = new List<Doplatum>();
}
