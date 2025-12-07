using System;
using System.Collections.Generic;

namespace BiuroTurystyczne1.Data.Models;

public partial class Grupa
{
    public uint IdGrupa { get; set; }

    public string NazwaGrupy { get; set; } = null!;

    public string? OpiekunGrupy { get; set; }

    public string? TelefonOpiekuna { get; set; }

    public string? Adnotacje { get; set; }

    public virtual ICollection<Klient> Klients { get; set; } = new List<Klient>();

    public virtual ICollection<Rezerwacja> Rezerwacjas { get; set; } = new List<Rezerwacja>();
}
