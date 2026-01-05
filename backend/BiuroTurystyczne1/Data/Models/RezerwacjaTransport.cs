using System;
using System.Collections.Generic;

namespace BiuroTurystyczne1.Data.Models;

public partial class RezerwacjaTransport
{
    public uint IdRezerwacjaTransport { get; set; }

    public uint IdRezerwacja { get; set; }

    public uint? IdTransportOferta { get; set; }

    public bool CzyDojazdWlasny { get; set; }

    public string? UwagiTransport { get; set; }

    public virtual Rezerwacja IdRezerwacjaNavigation { get; set; } = null!;

    public virtual TransportOfertum? IdTransportOfertaNavigation { get; set; }
}
