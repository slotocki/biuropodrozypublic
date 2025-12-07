using System;
using System.Collections.Generic;

namespace BiuroTurystyczne1.Data.Models;

public partial class ZdjecieOsrodka
{
    public uint IdZdjecie { get; set; }

    public uint IdOsrodek { get; set; }

    public string SciezkaPliku { get; set; } = null!;

    public string? OpisZdjecia { get; set; }

    public bool CzyGlowne { get; set; }

    public virtual Osrodek IdOsrodekNavigation { get; set; } = null!;
}
