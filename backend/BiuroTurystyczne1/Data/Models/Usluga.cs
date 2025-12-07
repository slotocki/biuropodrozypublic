using System;
using System.Collections.Generic;

namespace BiuroTurystyczne1.Data.Models;

public partial class Usluga
{
    public uint IdUsluga { get; set; }

    public string NazwaUslugi { get; set; } = null!;

    public decimal CenaNetto { get; set; }

    public decimal StawkaVat { get; set; }

    public decimal? CenaBrutto { get; set; }

    public virtual ICollection<FakturaVatPozycja> FakturaVatPozycjas { get; set; } = new List<FakturaVatPozycja>();
}
