using System;
using System.Collections.Generic;

namespace BiuroTurystyczne1.Data.Models;

public partial class Destynacja
{
    public uint IdDestynacja { get; set; }

    public string Nazwa { get; set; } = null!;

    public virtual ICollection<Ofertum> Oferta { get; set; } = new List<Ofertum>();

    public virtual ICollection<Osrodek> Osrodeks { get; set; } = new List<Osrodek>();

    public virtual ICollection<Zdjecium> Zdjecia { get; set; } = new List<Zdjecium>();
}
