using System;
using System.Collections.Generic;

namespace BiuroTurystyczne1.Data.Models;

public partial class Uprawnienie
{
    public uint IdUprawnienie { get; set; }

    public string Nazwa { get; set; } = null!;

    public string? Opis { get; set; }

    public virtual ICollection<Uzytkownik> IdUzytkowniks { get; set; } = new List<Uzytkownik>();
}
