using System;
using System.Collections.Generic;

namespace BiuroTurystyczne1.Data.Models;

public partial class Notatki
{
    public uint IdNotatki { get; set; }

    public string Tytul { get; set; } = null!;

    public string? Tresc { get; set; }

    public string? IdUzytkownik { get; set; }

    public DateTime DataPojawienia { get; set; }

    public DateTime? DataZnikniecia { get; set; }

    public virtual AspNetUser? IdUzytkownikNavigation { get; set; }
}
