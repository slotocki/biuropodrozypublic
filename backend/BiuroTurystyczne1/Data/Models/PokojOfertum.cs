using System;
using System.Collections.Generic;

namespace BiuroTurystyczne1.Data.Models;

public partial class PokojOfertum
{
    public uint IdPokojOferta { get; set; }

    public uint IdPokoj { get; set; }

    public uint IdOferta { get; set; }

    public virtual Ofertum IdOfertaNavigation { get; set; } = null!;

    public virtual Pokoj IdPokojNavigation { get; set; } = null!;
}
