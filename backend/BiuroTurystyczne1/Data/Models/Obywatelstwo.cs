using System;
using System.Collections.Generic;

namespace BiuroTurystyczne1.Data.Models;

public partial class Obywatelstwo
{
    public uint IdObywatelstwo { get; set; }

    public string Obywatelstwo1 { get; set; } = null!;

    public virtual ICollection<Klient> Klients { get; set; } = new List<Klient>();
}
