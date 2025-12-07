using System;
using System.Collections.Generic;

namespace BiuroTurystyczne1.Data.Models;

public partial class Zdjecium
{
    public uint IdZdjecie { get; set; }

    public uint? IdOsrodek { get; set; }

    public uint? IdDestynacja { get; set; }

    public string SciezkaPliku { get; set; } = null!;

    public string? OpisZdjecia { get; set; }

    /// <summary>
    /// Tagi oddzielone przecinkami
    /// </summary>
    public string? Tagi { get; set; }

    public bool CzyGlowne { get; set; }

    public virtual Destynacja? IdDestynacjaNavigation { get; set; }

    public virtual Osrodek? IdOsrodekNavigation { get; set; }
}
