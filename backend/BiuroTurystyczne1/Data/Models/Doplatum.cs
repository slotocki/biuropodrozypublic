using System;
using System.Collections.Generic;

namespace BiuroTurystyczne1.Data.Models;

public partial class Doplatum
{
    public uint IdDoplata { get; set; }

    public string NazwaDoplaty { get; set; } = null!;

    public decimal KwotaDoplaty { get; set; }

    public virtual ICollection<Osrodek> IdOsrodeks { get; set; } = new List<Osrodek>();
}
