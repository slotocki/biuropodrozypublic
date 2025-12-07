using System;
using System.Collections.Generic;

namespace BiuroTurystyczne1.Data.Models;

public partial class Kontrahent
{
    public uint IdKontrahent { get; set; }

    public string NazwaFirmy { get; set; } = null!;

    public string? Nip { get; set; }

    public string? Ulica { get; set; }

    public string? KodPocztowy { get; set; }

    public string? Miejscowosc { get; set; }

    public string? Email { get; set; }

    public string? NumerTelefonu { get; set; }

    public string? Adnotacje { get; set; }

    public virtual ICollection<FakturaVat> FakturaVats { get; set; } = new List<FakturaVat>();
}
