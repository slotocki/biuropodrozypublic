using System;
using System.Collections.Generic;

namespace BiuroTurystyczne1.Data.Models;

public partial class Promocja
{
    public uint IdPromocja { get; set; }

    public string NazwaPromocji { get; set; } = null!;

    public string? Opis { get; set; }

    public DateOnly DataOd { get; set; }

    public DateOnly DataDo { get; set; }

    public decimal? KwotaZnizki { get; set; }

    public decimal? ProcentZnizki { get; set; }

    public virtual ICollection<Rezerwacja> Rezerwacjas { get; set; } = new List<Rezerwacja>();
}
