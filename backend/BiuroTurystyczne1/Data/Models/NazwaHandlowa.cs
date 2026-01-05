using System;
using System.Collections.Generic;

namespace BiuroTurystyczne1.Data.Models;

public partial class NazwaHandlowa
{
    public uint IdNazwaHandlowa { get; set; }

    public string NazwaHandlowa1 { get; set; } = null!;

    public string? Opis { get; set; }

    public virtual ICollection<Ofertum> Oferta { get; set; } = new List<Ofertum>();
}
