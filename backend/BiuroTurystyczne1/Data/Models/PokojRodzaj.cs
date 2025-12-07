using System;
using System.Collections.Generic;

namespace BiuroTurystyczne1.Data.Models;

public partial class PokojRodzaj
{
    public uint IdRodzajPokoju { get; set; }

    public string RodzajPokoju { get; set; } = null!;

    public virtual ICollection<Pokoj> Pokojs { get; set; } = new List<Pokoj>();
}
