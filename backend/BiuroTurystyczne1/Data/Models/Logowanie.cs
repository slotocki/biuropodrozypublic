using System;
using System.Collections.Generic;

namespace BiuroTurystyczne1.Data.Models;

public partial class Logowanie
{
    public ulong IdLogowanie { get; set; }

    public string? IdUzytkownik { get; set; }

    public DateTime DataLogowania { get; set; }

    public string AdresIp { get; set; } = null!;

    public string StatusLogowania { get; set; } = null!;

    public virtual AspNetUser? IdUzytkownikNavigation { get; set; }
}
