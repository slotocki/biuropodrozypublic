using System;
using System.Collections.Generic;

namespace BiuroTurystyczne1.Data.Models;

public partial class Rezerwacja
{
    public uint IdRezerwacja { get; set; }

    public uint IdOferta { get; set; }

    public string StatusRezerwacji { get; set; } = null!;

    public string? ProsbyDodatkowe { get; set; }

    public decimal CenaCalosciowa { get; set; }

    public DateTime DataDodania { get; set; }

    public string? IdUzytkownik { get; set; }

    public uint? IdPromocja { get; set; }

    public uint? IdGrupa { get; set; }

    public virtual ICollection<FakturaVatMarza> FakturaVatMarzas { get; set; } = new List<FakturaVatMarza>();

    public virtual Grupa? IdGrupaNavigation { get; set; }

    public virtual Ofertum IdOfertaNavigation { get; set; } = null!;

    public virtual Promocja? IdPromocjaNavigation { get; set; }

    public virtual AspNetUser? IdUzytkownikNavigation { get; set; }

    public virtual ICollection<Platnosc> Platnoscs { get; set; } = new List<Platnosc>();

    public virtual Rozliczenie? Rozliczenie { get; set; }

    public virtual ICollection<UczestnikRezerwacji> UczestnikRezerwacjis { get; set; } = new List<UczestnikRezerwacji>();

    public virtual ICollection<Pokoj> IdPokojs { get; set; } = new List<Pokoj>();
}
