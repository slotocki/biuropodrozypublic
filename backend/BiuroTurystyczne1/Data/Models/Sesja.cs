using System;
using System.Collections.Generic;

namespace BiuroTurystyczne1.Data.Models;

public partial class Sesja
{
    public ulong IdSesja { get; set; }

    public string? IdUzytkownik { get; set; }

    public string TokenSesji { get; set; } = null!;

    public DateTime CzasStartu { get; set; }

    public DateTime? CzasZakonczenia { get; set; }

    public virtual AspNetUser? IdUzytkownikNavigation { get; set; }
}
