using System;
using System.Collections.Generic;

namespace BiuroTurystyczne1.Data.Models;

public partial class Uzytkownik
{
    public uint IdUzytkownik { get; set; }

    public string Login { get; set; } = null!;

    public string Haslo { get; set; } = null!;

    public string Rola { get; set; } = null!;

    public DateTime DataRejestracji { get; set; }

    public DateTime? OstatnieLogowanie { get; set; }

    public virtual ICollection<Uprawnienie> IdUprawnienies { get; set; } = new List<Uprawnienie>();
}
