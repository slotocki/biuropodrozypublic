using System;
using System.Collections.Generic;

namespace BiuroTurystyczne1.Data.Models;

public partial class AspNetUser
{
    public string Id { get; set; } = null!;

    public string? UserName { get; set; }

    public string? NormalizedUserName { get; set; }

    public string? Email { get; set; }

    public string? NormalizedEmail { get; set; }

    public bool EmailConfirmed { get; set; }

    public string? PasswordHash { get; set; }

    public string? SecurityStamp { get; set; }

    public string? ConcurrencyStamp { get; set; }

    public string? PhoneNumber { get; set; }

    public bool PhoneNumberConfirmed { get; set; }

    public bool TwoFactorEnabled { get; set; }

    public DateTime? LockoutEnd { get; set; }

    public bool LockoutEnabled { get; set; }

    public int AccessFailedCount { get; set; }

    public virtual ICollection<AspNetUserClaim> AspNetUserClaims { get; set; } = new List<AspNetUserClaim>();

    public virtual ICollection<AspNetUserLogin> AspNetUserLogins { get; set; } = new List<AspNetUserLogin>();

    public virtual ICollection<AspNetUserToken> AspNetUserTokens { get; set; } = new List<AspNetUserToken>();

    public virtual ICollection<FakturaVatMarza> FakturaVatMarzas { get; set; } = new List<FakturaVatMarza>();

    public virtual ICollection<FakturaVat> FakturaVats { get; set; } = new List<FakturaVat>();

    public virtual ICollection<Logowanie> Logowanies { get; set; } = new List<Logowanie>();

    public virtual ICollection<Notatki> Notatkis { get; set; } = new List<Notatki>();

    public virtual ICollection<Platnosc> Platnoscs { get; set; } = new List<Platnosc>();

    public virtual ICollection<Rezerwacja> Rezerwacjas { get; set; } = new List<Rezerwacja>();

    public virtual ICollection<Sesja> Sesjas { get; set; } = new List<Sesja>();

    public virtual ICollection<AspNetRole> Roles { get; set; } = new List<AspNetRole>();
}
