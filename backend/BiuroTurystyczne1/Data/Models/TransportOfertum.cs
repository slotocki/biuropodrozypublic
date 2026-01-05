using System;
using System.Collections.Generic;

namespace BiuroTurystyczne1.Data.Models;

public partial class TransportOfertum
{
    public uint IdTransportOferta { get; set; }

    public uint IdOferta { get; set; }

    public uint IdTransport { get; set; }

    public ushort? IloscMiejsc { get; set; }

    public TimeOnly? GodzinaOdjazdu { get; set; }

    public virtual Ofertum IdOfertaNavigation { get; set; } = null!;

    public virtual Transport IdTransportNavigation { get; set; } = null!;

    public virtual ICollection<RezerwacjaTransport> RezerwacjaTransports { get; set; } = new List<RezerwacjaTransport>();
}
