using System;
using System.Collections.Generic;

namespace BiuroTurystyczne1.Data.Models;

public partial class Wyzywienie
{
    public uint IdWyzywienie { get; set; }

    public string RodzajWyzywienia { get; set; } = null!;

    public virtual ICollection<Osrodek> Osrodeks { get; set; } = new List<Osrodek>();
}
