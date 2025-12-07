using System;
using System.Collections.Generic;

namespace BiuroTurystyczne1.Data.Models;

public partial class OfertaOsrodek
{
    public uint IdOfertaOsrodek { get; set; }

    public uint IdOferta { get; set; }

    public uint IdOsrodek { get; set; }

    /// <summary>
    /// Cena za osobę dla tego ośrodka w tej ofercie
    /// </summary>
    public decimal? CenaOs { get; set; }

    public virtual Ofertum IdOfertaNavigation { get; set; } = null!;

    public virtual Osrodek IdOsrodekNavigation { get; set; } = null!;
}
