using System;
using System.Collections.Generic;

namespace BiuroTurystyczne1.Data.Models;

public partial class FakturaVatMarza
{
    public uint IdFakturaMarza { get; set; }

    public uint IdRezerwacja { get; set; }

    public decimal KwotaMarza { get; set; }

    public string? TrescFaktury { get; set; }

    public DateOnly DataWystawienia { get; set; }

    public DateOnly? TerminPlatnosci { get; set; }

    public string? IdUser { get; set; }

    public virtual Rezerwacja IdRezerwacjaNavigation { get; set; } = null!;

    public virtual AspNetUser? IdUserNavigation { get; set; }
}
