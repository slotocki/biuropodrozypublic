using System;
using System.Collections.Generic;

namespace BiuroTurystyczne1.Data.Models;

public partial class FakturaVatPozycja
{
    public uint IdPozycja { get; set; }

    public uint IdFaktura { get; set; }

    public uint IdUsluga { get; set; }

    public decimal Ilosc { get; set; }

    public decimal CenaNetto { get; set; }

    public decimal StawkaVat { get; set; }

    public virtual FakturaVat IdFakturaNavigation { get; set; } = null!;

    public virtual Usluga IdUslugaNavigation { get; set; } = null!;
}
