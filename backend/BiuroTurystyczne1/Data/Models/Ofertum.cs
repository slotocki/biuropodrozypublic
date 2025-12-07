using System;
using System.Collections.Generic;

namespace BiuroTurystyczne1.Data.Models;

public partial class Ofertum
{
    public uint IdOferta { get; set; }

    public string NazwaHandlowa { get; set; } = null!;

    public uint IdDestynacja { get; set; }

    public DateOnly TerminOd { get; set; }

    public DateOnly TerminDo { get; set; }

    public DateOnly? DataZakwaterowania { get; set; }

    public DateOnly? DataWykwaterowania { get; set; }

    public uint IdTransport { get; set; }

    public uint IloscMiejscTransport { get; set; }

    public uint IloscMiejscPokoje { get; set; }

    public virtual Destynacja IdDestynacjaNavigation { get; set; } = null!;

    public virtual Transport IdTransportNavigation { get; set; } = null!;

    public virtual ICollection<OfertaOsrodek> OfertaOsrodeks { get; set; } = new List<OfertaOsrodek>();

    public virtual ICollection<PokojOfertum> PokojOferta { get; set; } = new List<PokojOfertum>();

    public virtual ICollection<Rezerwacja> Rezerwacjas { get; set; } = new List<Rezerwacja>();

    public virtual ICollection<MiejsceOdjazdu> IdMiejsces { get; set; } = new List<MiejsceOdjazdu>();
}
