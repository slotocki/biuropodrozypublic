using System;
using System.Collections.Generic;

namespace BiuroTurystyczne1.Data.Models;

public partial class Transport
{
    public uint IdTransport { get; set; }

    public string RodzajTransportu { get; set; } = null!;

    public virtual ICollection<TransportOfertum> TransportOferta { get; set; } = new List<TransportOfertum>();
}
