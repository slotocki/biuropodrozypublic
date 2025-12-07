using System;
using System.Collections.Generic;

namespace BiuroTurystyczne1.Data.Models;

public partial class Klient
{
    public uint IdKlient { get; set; }

    public string Imie { get; set; } = null!;

    public string Nazwisko { get; set; } = null!;

    public string? Ulica { get; set; }

    public string? KodPocztowy { get; set; }

    public string? Miejscowosc { get; set; }

    public string? Email { get; set; }

    public string? Telefon { get; set; }

    public uint? IdObywatelstwo { get; set; }

    public DateOnly? DataUrodzenia { get; set; }

    public string? Adnotacje { get; set; }

    public uint? IdGrupa { get; set; }

    public virtual Grupa? IdGrupaNavigation { get; set; }

    public virtual Obywatelstwo? IdObywatelstwoNavigation { get; set; }

    public virtual ICollection<UczestnikRezerwacji> UczestnikRezerwacjis { get; set; } = new List<UczestnikRezerwacji>();
}
