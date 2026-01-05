using System;
using System.Collections.Generic;

namespace BiuroTurystyczne1.Data.Models;

public partial class Ofertum
{
    public uint IdOferta { get; set; }

    public string? Opis { get; set; }

    public uint IdDestynacja { get; set; }

    public DateOnly TerminOd { get; set; }

    public DateOnly TerminDo { get; set; }

    public DateTime? DataZakwaterowania { get; set; }

    public DateTime? DataWykwaterowania { get; set; }

    public uint IloscMiejscTransport { get; set; }

    public uint IloscMiejscPokoje { get; set; }

    public bool? CzyAktywna { get; set; }

    public uint? IdNazwaHandlowa { get; set; }

    public virtual Destynacja IdDestynacjaNavigation { get; set; } = null!;

    public virtual NazwaHandlowa? IdNazwaHandlowaNavigation { get; set; }

    public virtual ICollection<OfertaOsrodek> OfertaOsrodeks { get; set; } = new List<OfertaOsrodek>();

    public virtual ICollection<PokojOfertum> PokojOferta { get; set; } = new List<PokojOfertum>();

    public virtual ICollection<Rezerwacja> Rezerwacjas { get; set; } = new List<Rezerwacja>();

    public virtual ICollection<TransportOfertum> TransportOferta { get; set; } = new List<TransportOfertum>();

    public virtual ICollection<MiejsceOdjazdu> IdMiejsces { get; set; } = new List<MiejsceOdjazdu>();
}
