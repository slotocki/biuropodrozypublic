using System;
using System.Collections.Generic;

namespace BiuroTurystyczne1.Data.Models;

public partial class MiejsceOdjazdu
{
    public uint IdMiejsce { get; set; }

    public string NazwaMiejsca { get; set; } = null!;

    public string? Adres { get; set; }

    public string? Opis { get; set; }

    public virtual ICollection<Ofertum> IdOferta { get; set; } = new List<Ofertum>();
}
