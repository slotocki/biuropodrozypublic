using System;
using System.Collections.Generic;

namespace BiuroTurystyczne1.Data.Models;

public partial class UczestnikRezerwacji
{
    public uint IdRezerwacja { get; set; }

    public uint IdKlient { get; set; }

    public string Rola { get; set; } = null!;

    public virtual Klient IdKlientNavigation { get; set; } = null!;

    public virtual Rezerwacja IdRezerwacjaNavigation { get; set; } = null!;
}
