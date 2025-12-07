using System;
using System.Collections.Generic;

namespace BiuroTurystyczne1.Data.Models;

public partial class Pokoj
{
    public uint IdPokoj { get; set; }

    public uint IdOsrodek { get; set; }

    public uint IdRodzajPokoju { get; set; }

    public byte IloscLozek { get; set; }

    public byte IloscOsob { get; set; }

    public byte MaxIloscOsob { get; set; }

    public virtual Osrodek IdOsrodekNavigation { get; set; } = null!;

    public virtual PokojRodzaj IdRodzajPokojuNavigation { get; set; } = null!;

    public virtual ICollection<PokojOfertum> PokojOferta { get; set; } = new List<PokojOfertum>();

    public virtual ICollection<Rezerwacja> IdRezerwacjas { get; set; } = new List<Rezerwacja>();
}
