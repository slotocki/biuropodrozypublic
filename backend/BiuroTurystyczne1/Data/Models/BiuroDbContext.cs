using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace BiuroTurystyczne1.Data.Models;

public partial class BiuroDbContext : DbContext
{
    public BiuroDbContext(DbContextOptions<BiuroDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<AspNetRole> AspNetRoles { get; set; }

    public virtual DbSet<AspNetRoleClaim> AspNetRoleClaims { get; set; }

    public virtual DbSet<AspNetUser> AspNetUsers { get; set; }

    public virtual DbSet<AspNetUserClaim> AspNetUserClaims { get; set; }

    public virtual DbSet<AspNetUserLogin> AspNetUserLogins { get; set; }

    public virtual DbSet<AspNetUserToken> AspNetUserTokens { get; set; }

    public virtual DbSet<Destynacja> Destynacjas { get; set; }

    public virtual DbSet<Doplatum> Doplata { get; set; }

    public virtual DbSet<EfmigrationsHistory> EfmigrationsHistories { get; set; }

    public virtual DbSet<FakturaVat> FakturaVats { get; set; }

    public virtual DbSet<FakturaVatMarza> FakturaVatMarzas { get; set; }

    public virtual DbSet<FakturaVatPozycja> FakturaVatPozycjas { get; set; }

    public virtual DbSet<Grupa> Grupas { get; set; }

    public virtual DbSet<Klient> Klients { get; set; }

    public virtual DbSet<Kontrahent> Kontrahents { get; set; }

    public virtual DbSet<Logowanie> Logowanies { get; set; }

    public virtual DbSet<MiejsceOdjazdu> MiejsceOdjazdus { get; set; }

    public virtual DbSet<NazwaHandlowa> NazwaHandlowas { get; set; }

    public virtual DbSet<Notatki> Notatkis { get; set; }

    public virtual DbSet<Obywatelstwo> Obywatelstwos { get; set; }

    public virtual DbSet<OfertaOsrodek> OfertaOsrodeks { get; set; }

    public virtual DbSet<Ofertum> Oferta { get; set; }

    public virtual DbSet<Osrodek> Osrodeks { get; set; }

    public virtual DbSet<Platnosc> Platnoscs { get; set; }

    public virtual DbSet<Pokoj> Pokojs { get; set; }

    public virtual DbSet<PokojOfertum> PokojOferta { get; set; }

    public virtual DbSet<PokojRodzaj> PokojRodzajs { get; set; }

    public virtual DbSet<Promocja> Promocjas { get; set; }

    public virtual DbSet<Rezerwacja> Rezerwacjas { get; set; }

    public virtual DbSet<RezerwacjaTransport> RezerwacjaTransports { get; set; }

    public virtual DbSet<Rozliczenie> Rozliczenies { get; set; }

    public virtual DbSet<Sesja> Sesjas { get; set; }

    public virtual DbSet<Transport> Transports { get; set; }

    public virtual DbSet<TransportOfertum> TransportOferta { get; set; }

    public virtual DbSet<UczestnikRezerwacji> UczestnikRezerwacjis { get; set; }

    public virtual DbSet<Usluga> Uslugas { get; set; }

    public virtual DbSet<Wyzywienie> Wyzywienies { get; set; }

    public virtual DbSet<Zdjecium> Zdjecia { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder
            .UseCollation("utf8mb4_general_ci")
            .HasCharSet("utf8mb4");

        modelBuilder.Entity<AspNetRole>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.HasIndex(e => e.NormalizedName, "RoleNameIndex").IsUnique();

            entity.Property(e => e.Name).HasMaxLength(256);
            entity.Property(e => e.NormalizedName).HasMaxLength(256);
        });

        modelBuilder.Entity<AspNetRoleClaim>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.HasIndex(e => e.RoleId, "IX_AspNetRoleClaims_RoleId");

            entity.Property(e => e.Id).HasColumnType("int(11)");

            entity.HasOne(d => d.Role).WithMany(p => p.AspNetRoleClaims).HasForeignKey(d => d.RoleId);
        });

        modelBuilder.Entity<AspNetUser>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.HasIndex(e => e.NormalizedEmail, "EmailIndex");

            entity.HasIndex(e => e.NormalizedUserName, "UserNameIndex").IsUnique();

            entity.Property(e => e.AccessFailedCount).HasColumnType("int(11)");
            entity.Property(e => e.Email).HasMaxLength(256);
            entity.Property(e => e.LockoutEnd).HasMaxLength(6);
            entity.Property(e => e.NormalizedEmail).HasMaxLength(256);
            entity.Property(e => e.NormalizedUserName).HasMaxLength(256);
            entity.Property(e => e.UserName).HasMaxLength(256);

            entity.HasMany(d => d.Roles).WithMany(p => p.Users)
                .UsingEntity<Dictionary<string, object>>(
                    "AspNetUserRole",
                    r => r.HasOne<AspNetRole>().WithMany().HasForeignKey("RoleId"),
                    l => l.HasOne<AspNetUser>().WithMany().HasForeignKey("UserId"),
                    j =>
                    {
                        j.HasKey("UserId", "RoleId")
                            .HasName("PRIMARY")
                            .HasAnnotation("MySql:IndexPrefixLength", new[] { 0, 0 });
                        j.ToTable("AspNetUserRoles");
                        j.HasIndex(new[] { "RoleId" }, "IX_AspNetUserRoles_RoleId");
                    });
        });

        modelBuilder.Entity<AspNetUserClaim>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.HasIndex(e => e.UserId, "IX_AspNetUserClaims_UserId");

            entity.Property(e => e.Id).HasColumnType("int(11)");

            entity.HasOne(d => d.User).WithMany(p => p.AspNetUserClaims).HasForeignKey(d => d.UserId);
        });

        modelBuilder.Entity<AspNetUserLogin>(entity =>
        {
            entity.HasKey(e => new { e.LoginProvider, e.ProviderKey })
                .HasName("PRIMARY")
                .HasAnnotation("MySql:IndexPrefixLength", new[] { 0, 0 });

            entity.HasIndex(e => e.UserId, "IX_AspNetUserLogins_UserId");

            entity.HasOne(d => d.User).WithMany(p => p.AspNetUserLogins).HasForeignKey(d => d.UserId);
        });

        modelBuilder.Entity<AspNetUserToken>(entity =>
        {
            entity.HasKey(e => new { e.UserId, e.LoginProvider, e.Name })
                .HasName("PRIMARY")
                .HasAnnotation("MySql:IndexPrefixLength", new[] { 0, 0, 0 });

            entity.HasOne(d => d.User).WithMany(p => p.AspNetUserTokens).HasForeignKey(d => d.UserId);
        });

        modelBuilder.Entity<Destynacja>(entity =>
        {
            entity.HasKey(e => e.IdDestynacja).HasName("PRIMARY");

            entity.ToTable("Destynacja");

            entity.HasIndex(e => e.Nazwa, "uq_destynacja__nazwa").IsUnique();

            entity.Property(e => e.IdDestynacja)
                .HasColumnType("int(10) unsigned")
                .HasColumnName("ID_destynacja");
            entity.Property(e => e.Nazwa).HasMaxLength(150);
        });

        modelBuilder.Entity<Doplatum>(entity =>
        {
            entity.HasKey(e => e.IdDoplata).HasName("PRIMARY");

            entity.Property(e => e.IdDoplata)
                .HasColumnType("int(10) unsigned")
                .HasColumnName("ID_doplata");
            entity.Property(e => e.KwotaDoplaty)
                .HasPrecision(10, 2)
                .HasColumnName("Kwota_doplaty");
            entity.Property(e => e.NazwaDoplaty)
                .HasMaxLength(150)
                .HasColumnName("Nazwa_doplaty");
        });

        modelBuilder.Entity<EfmigrationsHistory>(entity =>
        {
            entity.HasKey(e => e.MigrationId).HasName("PRIMARY");

            entity.ToTable("__EFMigrationsHistory");

            entity.Property(e => e.MigrationId).HasMaxLength(150);
            entity.Property(e => e.ProductVersion).HasMaxLength(32);
        });

        modelBuilder.Entity<FakturaVat>(entity =>
        {
            entity.HasKey(e => e.IdFaktura).HasName("PRIMARY");

            entity.ToTable("Faktura_VAT");

            entity.HasIndex(e => e.IdUser, "fk_fv_aspnetuser");

            entity.HasIndex(e => e.IdKontrahent, "fk_fv_kontr");

            entity.HasIndex(e => e.NumerFaktury, "idx_faktura_vat_numer");

            entity.HasIndex(e => e.OryginalnaFakturaId, "idx_oryginalna_faktura");

            entity.Property(e => e.IdFaktura)
                .HasColumnType("int(10) unsigned")
                .HasColumnName("ID_faktura");
            entity.Property(e => e.CzyAnulowana)
                .HasDefaultValueSql("'0'")
                .HasColumnName("czy_anulowana");
            entity.Property(e => e.DataWystawienia)
                .HasDefaultValueSql("curdate()")
                .HasColumnName("Data_wystawienia");
            entity.Property(e => e.FormaPlatnosci)
                .HasColumnType("enum('karta','gotówka','przelew 3 dni','przelew 7 dni','przelew 14 dni')")
                .HasColumnName("Forma_platnosci");
            entity.Property(e => e.IdKontrahent)
                .HasColumnType("int(10) unsigned")
                .HasColumnName("ID_kontrahent");
            entity.Property(e => e.IdUser).HasColumnName("ID_user");
            entity.Property(e => e.KwotaBrutto)
                .HasPrecision(12, 2)
                .HasColumnName("Kwota_brutto");
            entity.Property(e => e.KwotaNetto)
                .HasPrecision(12, 2)
                .HasColumnName("Kwota_netto");
            entity.Property(e => e.KwotaVat)
                .HasPrecision(12, 2)
                .HasColumnName("Kwota_VAT");
            entity.Property(e => e.NumerFaktury)
                .HasMaxLength(50)
                .HasColumnName("Numer_faktury");
            entity.Property(e => e.OryginalnaFakturaId)
                .HasColumnType("int(10) unsigned")
                .HasColumnName("oryginalna_faktura_id");
            entity.Property(e => e.SciezkaPdf)
                .HasMaxLength(255)
                .HasComment("Ścieżka do zapisanego pliku PDF")
                .HasColumnName("Sciezka_PDF");
            entity.Property(e => e.TerminPlatnosci).HasColumnName("Termin_platnosci");
            entity.Property(e => e.Wersja)
                .HasDefaultValueSql("'1'")
                .HasColumnType("int(11)")
                .HasColumnName("wersja");
            entity.Property(e => e.Zaplacono).HasPrecision(12, 2);

            entity.HasOne(d => d.IdKontrahentNavigation).WithMany(p => p.FakturaVats)
                .HasForeignKey(d => d.IdKontrahent)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_fv_kontr");

            entity.HasOne(d => d.IdUserNavigation).WithMany(p => p.FakturaVats)
                .HasForeignKey(d => d.IdUser)
                .HasConstraintName("fk_fv_aspnetuser");

            entity.HasOne(d => d.OryginalnaFaktura).WithMany(p => p.InverseOryginalnaFaktura)
                .HasForeignKey(d => d.OryginalnaFakturaId)
                .HasConstraintName("fk_faktura_oryginalna");
        });

        modelBuilder.Entity<FakturaVatMarza>(entity =>
        {
            entity.HasKey(e => e.IdFakturaMarza).HasName("PRIMARY");

            entity.ToTable("Faktura_VAT_Marza");

            entity.HasIndex(e => e.IdUser, "fk_fvm_aspnetuser");

            entity.HasIndex(e => e.IdRezerwacja, "fk_fvm_rez");

            entity.Property(e => e.IdFakturaMarza)
                .HasColumnType("int(10) unsigned")
                .HasColumnName("ID_faktura_marza");
            entity.Property(e => e.DataWystawienia)
                .HasDefaultValueSql("curdate()")
                .HasColumnName("Data_wystawienia");
            entity.Property(e => e.IdRezerwacja)
                .HasColumnType("int(10) unsigned")
                .HasColumnName("ID_rezerwacja");
            entity.Property(e => e.IdUser).HasColumnName("ID_user");
            entity.Property(e => e.KwotaMarza)
                .HasPrecision(12, 2)
                .HasColumnName("Kwota_marza");
            entity.Property(e => e.TerminPlatnosci).HasColumnName("Termin_platnosci");
            entity.Property(e => e.TrescFaktury)
                .HasColumnType("text")
                .HasColumnName("Tresc_faktury");

            entity.HasOne(d => d.IdRezerwacjaNavigation).WithMany(p => p.FakturaVatMarzas)
                .HasForeignKey(d => d.IdRezerwacja)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_fvm_rez");

            entity.HasOne(d => d.IdUserNavigation).WithMany(p => p.FakturaVatMarzas)
                .HasForeignKey(d => d.IdUser)
                .HasConstraintName("fk_fvm_aspnetuser");
        });

        modelBuilder.Entity<FakturaVatPozycja>(entity =>
        {
            entity.HasKey(e => e.IdPozycja).HasName("PRIMARY");

            entity.ToTable("Faktura_VAT_Pozycja");

            entity.HasIndex(e => e.IdFaktura, "fk_fvp_faktura");

            entity.HasIndex(e => e.IdUsluga, "fk_fvp_usluga");

            entity.Property(e => e.IdPozycja)
                .HasColumnType("int(10) unsigned")
                .HasColumnName("ID_pozycja");
            entity.Property(e => e.CenaNetto)
                .HasPrecision(10, 2)
                .HasColumnName("Cena_netto");
            entity.Property(e => e.IdFaktura)
                .HasColumnType("int(10) unsigned")
                .HasColumnName("ID_faktura");
            entity.Property(e => e.IdUsluga)
                .HasColumnType("int(10) unsigned")
                .HasColumnName("ID_usluga");
            entity.Property(e => e.Ilosc)
                .HasPrecision(10, 2)
                .HasDefaultValueSql("'1.00'");
            entity.Property(e => e.StawkaVat)
                .HasPrecision(5, 2)
                .HasColumnName("Stawka_VAT");

            entity.HasOne(d => d.IdFakturaNavigation).WithMany(p => p.FakturaVatPozycjas)
                .HasForeignKey(d => d.IdFaktura)
                .HasConstraintName("fk_fvp_faktura");

            entity.HasOne(d => d.IdUslugaNavigation).WithMany(p => p.FakturaVatPozycjas)
                .HasForeignKey(d => d.IdUsluga)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_fvp_usluga");
        });

        modelBuilder.Entity<Grupa>(entity =>
        {
            entity.HasKey(e => e.IdGrupa).HasName("PRIMARY");

            entity.ToTable("Grupa");

            entity.HasIndex(e => e.NazwaGrupy, "uq_grupa__nazwa").IsUnique();

            entity.Property(e => e.IdGrupa)
                .HasColumnType("int(10) unsigned")
                .HasColumnName("ID_grupa");
            entity.Property(e => e.Adnotacje).HasMaxLength(500);
            entity.Property(e => e.NazwaGrupy).HasColumnName("Nazwa_grupy");
            entity.Property(e => e.OpiekunGrupy)
                .HasMaxLength(255)
                .HasColumnName("Opiekun_grupy");
            entity.Property(e => e.TelefonOpiekuna)
                .HasMaxLength(40)
                .HasColumnName("Telefon_opiekuna");
        });

        modelBuilder.Entity<Klient>(entity =>
        {
            entity.HasKey(e => e.IdKlient).HasName("PRIMARY");

            entity.ToTable("Klient");

            entity.HasIndex(e => e.IdGrupa, "fk_klient_grupa");

            entity.HasIndex(e => e.IdObywatelstwo, "fk_klient_obyw");

            entity.HasIndex(e => e.Email, "uq_klient__email").IsUnique();

            entity.Property(e => e.IdKlient)
                .HasColumnType("int(10) unsigned")
                .HasColumnName("ID_klient");
            entity.Property(e => e.Adnotacje).HasMaxLength(500);
            entity.Property(e => e.DataUrodzenia).HasColumnName("Data_urodzenia");
            entity.Property(e => e.Email).HasMaxLength(180);
            entity.Property(e => e.IdGrupa)
                .HasColumnType("int(10) unsigned")
                .HasColumnName("ID_grupa");
            entity.Property(e => e.IdObywatelstwo)
                .HasColumnType("int(10) unsigned")
                .HasColumnName("ID_obywatelstwo");
            entity.Property(e => e.Imie).HasMaxLength(100);
            entity.Property(e => e.KodPocztowy)
                .HasMaxLength(20)
                .HasColumnName("Kod_pocztowy");
            entity.Property(e => e.Miejscowosc).HasMaxLength(120);
            entity.Property(e => e.Nazwisko).HasMaxLength(120);
            entity.Property(e => e.Telefon).HasMaxLength(40);
            entity.Property(e => e.Ulica).HasMaxLength(150);

            entity.HasOne(d => d.IdGrupaNavigation).WithMany(p => p.Klients)
                .HasForeignKey(d => d.IdGrupa)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("fk_klient_grupa");

            entity.HasOne(d => d.IdObywatelstwoNavigation).WithMany(p => p.Klients)
                .HasForeignKey(d => d.IdObywatelstwo)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("fk_klient_obyw");
        });

        modelBuilder.Entity<Kontrahent>(entity =>
        {
            entity.HasKey(e => e.IdKontrahent).HasName("PRIMARY");

            entity.ToTable("Kontrahent");

            entity.HasIndex(e => e.Nip, "uq_kontrahent__nip").IsUnique();

            entity.Property(e => e.IdKontrahent)
                .HasColumnType("int(10) unsigned")
                .HasColumnName("ID_kontrahent");
            entity.Property(e => e.Adnotacje).HasMaxLength(500);
            entity.Property(e => e.Email).HasMaxLength(180);
            entity.Property(e => e.KodPocztowy)
                .HasMaxLength(20)
                .HasColumnName("Kod_pocztowy");
            entity.Property(e => e.Miejscowosc).HasMaxLength(120);
            entity.Property(e => e.NazwaFirmy)
                .HasMaxLength(200)
                .HasColumnName("Nazwa_firmy");
            entity.Property(e => e.Nip)
                .HasMaxLength(20)
                .HasColumnName("NIP");
            entity.Property(e => e.NumerTelefonu)
                .HasMaxLength(40)
                .HasColumnName("Numer_telefonu");
            entity.Property(e => e.Ulica).HasMaxLength(150);
        });

        modelBuilder.Entity<Logowanie>(entity =>
        {
            entity.HasKey(e => e.IdLogowanie).HasName("PRIMARY");

            entity.ToTable("Logowanie");

            entity.HasIndex(e => e.IdUzytkownik, "fk_log_aspnetuser");

            entity.Property(e => e.IdLogowanie)
                .HasColumnType("bigint(20) unsigned")
                .HasColumnName("ID_logowanie");
            entity.Property(e => e.AdresIp)
                .HasMaxLength(45)
                .HasColumnName("Adres_IP");
            entity.Property(e => e.DataLogowania)
                .HasDefaultValueSql("current_timestamp()")
                .HasColumnType("datetime")
                .HasColumnName("Data_logowania");
            entity.Property(e => e.IdUzytkownik).HasColumnName("ID_uzytkownik");
            entity.Property(e => e.StatusLogowania)
                .HasColumnType("enum('SUCCESS','FAIL')")
                .HasColumnName("Status_logowania");

            entity.HasOne(d => d.IdUzytkownikNavigation).WithMany(p => p.Logowanies)
                .HasForeignKey(d => d.IdUzytkownik)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("fk_log_aspnetuser");
        });

        modelBuilder.Entity<MiejsceOdjazdu>(entity =>
        {
            entity.HasKey(e => e.IdMiejsce).HasName("PRIMARY");

            entity.ToTable("Miejsce_odjazdu");

            entity.HasIndex(e => e.NazwaMiejsca, "uq_miejsce_odjazdu__nazwa").IsUnique();

            entity.Property(e => e.IdMiejsce)
                .HasColumnType("int(10) unsigned")
                .HasColumnName("ID_miejsce");
            entity.Property(e => e.Adres).HasMaxLength(255);
            entity.Property(e => e.NazwaMiejsca)
                .HasMaxLength(180)
                .HasColumnName("Nazwa_miejsca");
            entity.Property(e => e.Opis).HasMaxLength(500);
        });

        modelBuilder.Entity<NazwaHandlowa>(entity =>
        {
            entity.HasKey(e => e.IdNazwaHandlowa).HasName("PRIMARY");

            entity.ToTable("NazwaHandlowa");

            entity.HasIndex(e => e.NazwaHandlowa1, "uq_nazwahandlowa").IsUnique();

            entity.Property(e => e.IdNazwaHandlowa)
                .HasColumnType("int(10) unsigned")
                .HasColumnName("ID_nazwa_handlowa");
            entity.Property(e => e.NazwaHandlowa1)
                .HasMaxLength(200)
                .HasColumnName("NazwaHandlowa");
            entity.Property(e => e.Opis).HasColumnType("text");
        });

        modelBuilder.Entity<Notatki>(entity =>
        {
            entity.HasKey(e => e.IdNotatki).HasName("PRIMARY");

            entity.ToTable("Notatki");

            entity.HasIndex(e => e.IdUzytkownik, "idx_uzytkownik");

            entity.Property(e => e.IdNotatki)
                .HasColumnType("int(10) unsigned")
                .HasColumnName("ID_notatki");
            entity.Property(e => e.DataPojawienia)
                .HasDefaultValueSql("current_timestamp()")
                .HasColumnType("datetime")
                .HasColumnName("Data_pojawienia");
            entity.Property(e => e.DataZnikniecia)
                .HasColumnType("datetime")
                .HasColumnName("Data_znikniecia");
            entity.Property(e => e.IdUzytkownik).HasColumnName("ID_uzytkownik");
            entity.Property(e => e.Tresc).HasColumnType("text");
            entity.Property(e => e.Tytul).HasMaxLength(255);

            entity.HasOne(d => d.IdUzytkownikNavigation).WithMany(p => p.Notatkis)
                .HasForeignKey(d => d.IdUzytkownik)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("fk_notatka_aspnetuser");
        });

        modelBuilder.Entity<Obywatelstwo>(entity =>
        {
            entity.HasKey(e => e.IdObywatelstwo).HasName("PRIMARY");

            entity.ToTable("Obywatelstwo");

            entity.HasIndex(e => e.Obywatelstwo1, "uq_obywatelstwo__nazwa").IsUnique();

            entity.Property(e => e.IdObywatelstwo)
                .HasColumnType("int(10) unsigned")
                .HasColumnName("ID_obywatelstwo");
            entity.Property(e => e.Obywatelstwo1)
                .HasMaxLength(120)
                .HasColumnName("Obywatelstwo");
        });

        modelBuilder.Entity<OfertaOsrodek>(entity =>
        {
            entity.HasKey(e => e.IdOfertaOsrodek).HasName("PRIMARY");

            entity.ToTable("Oferta_osrodek");

            entity.HasIndex(e => e.IdOsrodek, "fk_ofo_osr");

            entity.HasIndex(e => new { e.IdOferta, e.IdOsrodek }, "uq_oferta_osrodek__pair").IsUnique();

            entity.Property(e => e.IdOfertaOsrodek)
                .HasColumnType("int(10) unsigned")
                .HasColumnName("ID_oferta_osrodek");
            entity.Property(e => e.CenaOs)
                .HasPrecision(10, 2)
                .HasComment("Cena za osobę dla tego ośrodka w tej ofercie")
                .HasColumnName("Cena_os");
            entity.Property(e => e.IdOferta)
                .HasColumnType("int(10) unsigned")
                .HasColumnName("ID_oferta");
            entity.Property(e => e.IdOsrodek)
                .HasColumnType("int(10) unsigned")
                .HasColumnName("ID_osrodek");

            entity.HasOne(d => d.IdOfertaNavigation).WithMany(p => p.OfertaOsrodeks)
                .HasForeignKey(d => d.IdOferta)
                .HasConstraintName("fk_ofo_oferta");

            entity.HasOne(d => d.IdOsrodekNavigation).WithMany(p => p.OfertaOsrodeks)
                .HasForeignKey(d => d.IdOsrodek)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_ofo_osr");
        });

        modelBuilder.Entity<Ofertum>(entity =>
        {
            entity.HasKey(e => e.IdOferta).HasName("PRIMARY");

            entity.HasIndex(e => e.IdDestynacja, "fk_oferta_dest");

            entity.HasIndex(e => e.IdNazwaHandlowa, "fk_oferta_nazwahandlowa");

            entity.HasIndex(e => new { e.CzyAktywna, e.TerminDo }, "idx_oferta_aktywna");

            entity.Property(e => e.IdOferta)
                .HasColumnType("int(10) unsigned")
                .HasColumnName("ID_oferta");
            entity.Property(e => e.CzyAktywna)
                .IsRequired()
                .HasDefaultValueSql("'1'")
                .HasColumnName("Czy_aktywna");
            entity.Property(e => e.DataWykwaterowania)
                .HasColumnType("datetime")
                .HasColumnName("Data_wykwaterowania");
            entity.Property(e => e.DataZakwaterowania)
                .HasColumnType("datetime")
                .HasColumnName("Data_zakwaterowania");
            entity.Property(e => e.IdDestynacja)
                .HasColumnType("int(10) unsigned")
                .HasColumnName("ID_destynacja");
            entity.Property(e => e.IdNazwaHandlowa)
                .HasColumnType("int(10) unsigned")
                .HasColumnName("ID_nazwa_handlowa");
            entity.Property(e => e.IloscMiejscPokoje)
                .HasColumnType("int(10) unsigned")
                .HasColumnName("Ilosc_miejsc_pokoje");
            entity.Property(e => e.IloscMiejscTransport)
                .HasColumnType("int(10) unsigned")
                .HasColumnName("Ilosc_miejsc_transport");
            entity.Property(e => e.Opis).HasColumnType("text");
            entity.Property(e => e.TerminDo).HasColumnName("Termin_do");
            entity.Property(e => e.TerminOd).HasColumnName("Termin_od");

            entity.HasOne(d => d.IdDestynacjaNavigation).WithMany(p => p.Oferta)
                .HasForeignKey(d => d.IdDestynacja)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_oferta_dest");

            entity.HasOne(d => d.IdNazwaHandlowaNavigation).WithMany(p => p.Oferta)
                .HasForeignKey(d => d.IdNazwaHandlowa)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("fk_oferta_nazwahandlowa");

            entity.HasMany(d => d.IdMiejsces).WithMany(p => p.IdOferta)
                .UsingEntity<Dictionary<string, object>>(
                    "OfertaMiejsceOdjazdu",
                    r => r.HasOne<MiejsceOdjazdu>().WithMany()
                        .HasForeignKey("IdMiejsce")
                        .HasConstraintName("fk_ofmiej_miejsce"),
                    l => l.HasOne<Ofertum>().WithMany()
                        .HasForeignKey("IdOferta")
                        .HasConstraintName("fk_ofmiej_oferta"),
                    j =>
                    {
                        j.HasKey("IdOferta", "IdMiejsce")
                            .HasName("PRIMARY")
                            .HasAnnotation("MySql:IndexPrefixLength", new[] { 0, 0 });
                        j.ToTable("Oferta_Miejsce_odjazdu");
                        j.HasIndex(new[] { "IdMiejsce" }, "fk_ofmiej_miejsce");
                        j.IndexerProperty<uint>("IdOferta")
                            .HasColumnType("int(10) unsigned")
                            .HasColumnName("ID_oferta");
                        j.IndexerProperty<uint>("IdMiejsce")
                            .HasColumnType("int(10) unsigned")
                            .HasColumnName("ID_miejsce");
                    });
        });

        modelBuilder.Entity<Osrodek>(entity =>
        {
            entity.HasKey(e => e.IdOsrodek).HasName("PRIMARY");

            entity.ToTable("Osrodek");

            entity.HasIndex(e => e.IdDestynacja, "fk_osr_dest");

            entity.HasIndex(e => e.IdWyzywienie, "fk_osr_wyz");

            entity.Property(e => e.IdOsrodek)
                .HasColumnType("int(10) unsigned")
                .HasColumnName("ID_osrodek");
            entity.Property(e => e.Adnotacje).HasMaxLength(500);
            entity.Property(e => e.IdDestynacja)
                .HasColumnType("int(10) unsigned")
                .HasColumnName("ID_destynacja");
            entity.Property(e => e.IdWyzywienie)
                .HasColumnType("int(10) unsigned")
                .HasColumnName("ID_wyzywienie");
            entity.Property(e => e.KodPocztowy)
                .HasMaxLength(20)
                .HasColumnName("Kod_pocztowy");
            entity.Property(e => e.Miejscowosc).HasMaxLength(120);
            entity.Property(e => e.NazwaOsrodka)
                .HasMaxLength(180)
                .HasColumnName("Nazwa_osrodka");
            entity.Property(e => e.Opis).HasColumnType("text");
            entity.Property(e => e.Ulica).HasMaxLength(120);

            entity.HasOne(d => d.IdDestynacjaNavigation).WithMany(p => p.Osrodeks)
                .HasForeignKey(d => d.IdDestynacja)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_osr_dest");

            entity.HasOne(d => d.IdWyzywienieNavigation).WithMany(p => p.Osrodeks)
                .HasForeignKey(d => d.IdWyzywienie)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_osr_wyz");

            entity.HasMany(d => d.IdDoplata).WithMany(p => p.IdOsrodeks)
                .UsingEntity<Dictionary<string, object>>(
                    "DoplataOsrodek",
                    r => r.HasOne<Doplatum>().WithMany()
                        .HasForeignKey("IdDoplata")
                        .OnDelete(DeleteBehavior.ClientSetNull)
                        .HasConstraintName("fk_doposr_dop"),
                    l => l.HasOne<Osrodek>().WithMany()
                        .HasForeignKey("IdOsrodek")
                        .HasConstraintName("fk_doposr_osr"),
                    j =>
                    {
                        j.HasKey("IdOsrodek", "IdDoplata")
                            .HasName("PRIMARY")
                            .HasAnnotation("MySql:IndexPrefixLength", new[] { 0, 0 });
                        j.ToTable("Doplata_osrodek");
                        j.HasIndex(new[] { "IdDoplata" }, "fk_doposr_dop");
                        j.IndexerProperty<uint>("IdOsrodek")
                            .HasColumnType("int(10) unsigned")
                            .HasColumnName("ID_osrodek");
                        j.IndexerProperty<uint>("IdDoplata")
                            .HasColumnType("int(10) unsigned")
                            .HasColumnName("ID_doplata");
                    });
        });

        modelBuilder.Entity<Platnosc>(entity =>
        {
            entity.HasKey(e => e.IdPlatnosc).HasName("PRIMARY");

            entity.ToTable("Platnosc");

            entity.HasIndex(e => e.IdRezerwacja, "ix_platnosc__rez");

            entity.HasIndex(e => e.IdRozliczenie, "ix_platnosc__roz");

            entity.HasIndex(e => e.IdUser, "ix_platnosc__user");

            entity.Property(e => e.IdPlatnosc)
                .HasColumnType("int(10) unsigned")
                .HasColumnName("ID_platnosc");
            entity.Property(e => e.DataPlatnosci)
                .HasDefaultValueSql("current_timestamp()")
                .HasColumnType("datetime")
                .HasColumnName("Data_platnosci");
            entity.Property(e => e.IdRezerwacja)
                .HasColumnType("int(10) unsigned")
                .HasColumnName("ID_rezerwacja");
            entity.Property(e => e.IdRozliczenie)
                .HasColumnType("int(10) unsigned")
                .HasColumnName("ID_rozliczenie");
            entity.Property(e => e.IdUser).HasColumnName("ID_user");
            entity.Property(e => e.KwotaPlatnosci)
                .HasPrecision(12, 2)
                .HasColumnName("Kwota_platnosci");
            entity.Property(e => e.SposobPlatnosci)
                .HasColumnType("enum('GOTOWKA','KARTA','PRZELEW','BLIK','ONLINE')")
                .HasColumnName("Sposob_platnosci");
            entity.Property(e => e.StatusPlatnosci)
                .HasDefaultValueSql("'NOWA'")
                .HasColumnType("enum('NOWA','ZAKSIEGOWANA','ODRZUCONA','ZWROT')")
                .HasColumnName("Status_platnosci");

            entity.HasOne(d => d.IdRezerwacjaNavigation).WithMany(p => p.Platnoscs)
                .HasForeignKey(d => d.IdRezerwacja)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_plat_rez");

            entity.HasOne(d => d.IdRozliczenieNavigation).WithMany(p => p.Platnoscs)
                .HasForeignKey(d => d.IdRozliczenie)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_plat_roz");

            entity.HasOne(d => d.IdUserNavigation).WithMany(p => p.Platnoscs)
                .HasForeignKey(d => d.IdUser)
                .HasConstraintName("fk_plat_aspnetuser");
        });

        modelBuilder.Entity<Pokoj>(entity =>
        {
            entity.HasKey(e => e.IdPokoj).HasName("PRIMARY");

            entity.ToTable("Pokoj");

            entity.HasIndex(e => e.IdOsrodek, "fk_pokoj_osr");

            entity.HasIndex(e => e.IdRodzajPokoju, "fk_pokoj_rodzaj");

            entity.Property(e => e.IdPokoj)
                .HasColumnType("int(10) unsigned")
                .HasColumnName("ID_pokoj");
            entity.Property(e => e.IdOsrodek)
                .HasColumnType("int(10) unsigned")
                .HasColumnName("ID_osrodek");
            entity.Property(e => e.IdRodzajPokoju)
                .HasColumnType("int(10) unsigned")
                .HasColumnName("ID_rodzaj_pokoju");
            entity.Property(e => e.IloscLozek)
                .HasColumnType("tinyint(3) unsigned")
                .HasColumnName("Ilosc_lozek");
            entity.Property(e => e.IloscOsob)
                .HasColumnType("tinyint(3) unsigned")
                .HasColumnName("Ilosc_osob");
            entity.Property(e => e.MaxIloscOsob)
                .HasColumnType("tinyint(3) unsigned")
                .HasColumnName("Max_ilosc_osob");
            entity.Property(e => e.NumerPokoju)
                .HasMaxLength(255)
                .HasColumnName("numer_pokoju");
            entity.Property(e => e.OpisPokoju)
                .HasMaxLength(255)
                .HasColumnName("opis_pokoju");

            entity.HasOne(d => d.IdOsrodekNavigation).WithMany(p => p.Pokojs)
                .HasForeignKey(d => d.IdOsrodek)
                .HasConstraintName("fk_pokoj_osr");

            entity.HasOne(d => d.IdRodzajPokojuNavigation).WithMany(p => p.Pokojs)
                .HasForeignKey(d => d.IdRodzajPokoju)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_pokoj_rodzaj");
        });

        modelBuilder.Entity<PokojOfertum>(entity =>
        {
            entity.HasKey(e => e.IdPokojOferta).HasName("PRIMARY");

            entity.ToTable("Pokoj_oferta");

            entity.HasIndex(e => e.IdOferta, "fk_poko_oferta");

            entity.HasIndex(e => new { e.IdPokoj, e.IdOferta }, "uq_poko__pair").IsUnique();

            entity.Property(e => e.IdPokojOferta)
                .HasColumnType("int(10) unsigned")
                .HasColumnName("ID_pokoj_oferta");
            entity.Property(e => e.IdOferta)
                .HasColumnType("int(10) unsigned")
                .HasColumnName("ID_oferta");
            entity.Property(e => e.IdPokoj)
                .HasColumnType("int(10) unsigned")
                .HasColumnName("ID_pokoj");

            entity.HasOne(d => d.IdOfertaNavigation).WithMany(p => p.PokojOferta)
                .HasForeignKey(d => d.IdOferta)
                .HasConstraintName("fk_poko_oferta");

            entity.HasOne(d => d.IdPokojNavigation).WithMany(p => p.PokojOferta)
                .HasForeignKey(d => d.IdPokoj)
                .HasConstraintName("fk_poko_pokoj");
        });

        modelBuilder.Entity<PokojRodzaj>(entity =>
        {
            entity.HasKey(e => e.IdRodzajPokoju).HasName("PRIMARY");

            entity.ToTable("Pokoj_rodzaj");

            entity.HasIndex(e => e.RodzajPokoju, "uq_pokoj_rodzaj__rodzaj").IsUnique();

            entity.Property(e => e.IdRodzajPokoju)
                .HasColumnType("int(10) unsigned")
                .HasColumnName("ID_rodzaj_pokoju");
            entity.Property(e => e.RodzajPokoju)
                .HasMaxLength(120)
                .HasColumnName("Rodzaj_pokoju");
        });

        modelBuilder.Entity<Promocja>(entity =>
        {
            entity.HasKey(e => e.IdPromocja).HasName("PRIMARY");

            entity.ToTable("Promocja");

            entity.Property(e => e.IdPromocja)
                .HasColumnType("int(10) unsigned")
                .HasColumnName("ID_promocja");
            entity.Property(e => e.DataDo).HasColumnName("Data_do");
            entity.Property(e => e.DataOd).HasColumnName("Data_od");
            entity.Property(e => e.KwotaZnizki)
                .HasPrecision(10, 2)
                .HasDefaultValueSql("'0.00'")
                .HasColumnName("Kwota_znizki");
            entity.Property(e => e.NazwaPromocji)
                .HasMaxLength(150)
                .HasColumnName("Nazwa_promocji");
            entity.Property(e => e.Opis).HasMaxLength(500);
            entity.Property(e => e.ProcentZnizki)
                .HasPrecision(5, 2)
                .HasDefaultValueSql("'0.00'")
                .HasColumnName("Procent_znizki");
        });

        modelBuilder.Entity<Rezerwacja>(entity =>
        {
            entity.HasKey(e => e.IdRezerwacja).HasName("PRIMARY");

            entity.ToTable("Rezerwacja");

            entity.HasIndex(e => e.IdUzytkownik, "fk_rez_aspnetuser");

            entity.HasIndex(e => e.IdOferta, "fk_rez_oferta");

            entity.HasIndex(e => e.IdPromocja, "fk_rez_promocja");

            entity.HasIndex(e => e.IdGrupa, "fk_rezerwacja_grupa");

            entity.Property(e => e.IdRezerwacja)
                .HasColumnType("int(10) unsigned")
                .HasColumnName("ID_rezerwacja");
            entity.Property(e => e.CenaCalosciowa)
                .HasPrecision(12, 2)
                .HasColumnName("Cena_calosciowa");
            entity.Property(e => e.DataDodania)
                .HasDefaultValueSql("current_timestamp()")
                .HasColumnType("datetime")
                .HasColumnName("Data_dodania");
            entity.Property(e => e.IdGrupa)
                .HasColumnType("int(10) unsigned")
                .HasColumnName("ID_grupa");
            entity.Property(e => e.IdOferta)
                .HasColumnType("int(10) unsigned")
                .HasColumnName("ID_oferta");
            entity.Property(e => e.IdPromocja)
                .HasColumnType("int(10) unsigned")
                .HasColumnName("ID_promocja");
            entity.Property(e => e.IdUzytkownik).HasColumnName("ID_uzytkownik");
            entity.Property(e => e.ProsbyDodatkowe)
                .HasMaxLength(500)
                .HasColumnName("Prosby_dodatkowe");
            entity.Property(e => e.StatusRezerwacji)
                .HasDefaultValueSql("'NOWA'")
                .HasColumnType("enum('NOWA','OPCJA','POTWIERDZONA','ANULOWANA','ZAKONCZONA')")
                .HasColumnName("Status_rezerwacji");

            entity.HasOne(d => d.IdGrupaNavigation).WithMany(p => p.Rezerwacjas)
                .HasForeignKey(d => d.IdGrupa)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("fk_rezerwacja_grupa");

            entity.HasOne(d => d.IdOfertaNavigation).WithMany(p => p.Rezerwacjas)
                .HasForeignKey(d => d.IdOferta)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_rez_oferta");

            entity.HasOne(d => d.IdPromocjaNavigation).WithMany(p => p.Rezerwacjas)
                .HasForeignKey(d => d.IdPromocja)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("fk_rez_promocja");

            entity.HasOne(d => d.IdUzytkownikNavigation).WithMany(p => p.Rezerwacjas)
                .HasForeignKey(d => d.IdUzytkownik)
                .HasConstraintName("fk_rez_aspnetuser");

            entity.HasMany(d => d.IdPokojs).WithMany(p => p.IdRezerwacjas)
                .UsingEntity<Dictionary<string, object>>(
                    "RezerwacjaPokoj",
                    r => r.HasOne<Pokoj>().WithMany()
                        .HasForeignKey("IdPokoj")
                        .OnDelete(DeleteBehavior.ClientSetNull)
                        .HasConstraintName("fk_rezpok_pokoj"),
                    l => l.HasOne<Rezerwacja>().WithMany()
                        .HasForeignKey("IdRezerwacja")
                        .HasConstraintName("fk_rezpok_rezerwacja"),
                    j =>
                    {
                        j.HasKey("IdRezerwacja", "IdPokoj")
                            .HasName("PRIMARY")
                            .HasAnnotation("MySql:IndexPrefixLength", new[] { 0, 0 });
                        j.ToTable("Rezerwacja_Pokoj");
                        j.HasIndex(new[] { "IdPokoj" }, "fk_rezpok_pokoj");
                        j.IndexerProperty<uint>("IdRezerwacja")
                            .HasColumnType("int(10) unsigned")
                            .HasColumnName("ID_rezerwacja");
                        j.IndexerProperty<uint>("IdPokoj")
                            .HasColumnType("int(10) unsigned")
                            .HasColumnName("ID_pokoj");
                    });
        });

        modelBuilder.Entity<RezerwacjaTransport>(entity =>
        {
            entity.HasKey(e => e.IdRezerwacjaTransport).HasName("PRIMARY");

            entity.ToTable("Rezerwacja_transport");

            entity.HasIndex(e => e.IdRezerwacja, "fk_reztrans_rez");

            entity.HasIndex(e => e.IdTransportOferta, "fk_reztrans_trans");

            entity.Property(e => e.IdRezerwacjaTransport)
                .HasColumnType("int(10) unsigned")
                .HasColumnName("ID_rezerwacja_transport");
            entity.Property(e => e.CzyDojazdWlasny).HasColumnName("Czy_dojazd_wlasny");
            entity.Property(e => e.IdRezerwacja)
                .HasColumnType("int(10) unsigned")
                .HasColumnName("ID_rezerwacja");
            entity.Property(e => e.IdTransportOferta)
                .HasColumnType("int(10) unsigned")
                .HasColumnName("ID_transport_oferta");
            entity.Property(e => e.UwagiTransport)
                .HasMaxLength(255)
                .HasColumnName("Uwagi_transport");

            entity.HasOne(d => d.IdRezerwacjaNavigation).WithMany(p => p.RezerwacjaTransports)
                .HasForeignKey(d => d.IdRezerwacja)
                .HasConstraintName("fk_reztrans_rez");

            entity.HasOne(d => d.IdTransportOfertaNavigation).WithMany(p => p.RezerwacjaTransports)
                .HasForeignKey(d => d.IdTransportOferta)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("fk_reztrans_trans");
        });

        modelBuilder.Entity<Rozliczenie>(entity =>
        {
            entity.HasKey(e => e.IdRozliczenie).HasName("PRIMARY");

            entity.ToTable("Rozliczenie");

            entity.HasIndex(e => e.IdRezerwacja, "uq_roz__rez").IsUnique();

            entity.Property(e => e.IdRozliczenie)
                .HasColumnType("int(10) unsigned")
                .HasColumnName("ID_rozliczenie");
            entity.Property(e => e.DataUregulowania)
                .HasColumnType("datetime")
                .HasColumnName("Data_uregulowania");
            entity.Property(e => e.IdRezerwacja)
                .HasColumnType("int(10) unsigned")
                .HasColumnName("ID_rezerwacja");
            entity.Property(e => e.KwotaCalosciowa)
                .HasPrecision(12, 2)
                .HasColumnName("Kwota_calosciowa");
            entity.Property(e => e.KwotaZaplacona)
                .HasPrecision(12, 2)
                .HasColumnName("Kwota_zaplacona");
            entity.Property(e => e.PozostaloDoPlatnosci)
                .HasPrecision(12, 2)
                .HasComputedColumnSql("greatest(`Kwota_calosciowa` - `Kwota_zaplacona`,0)", false)
                .HasColumnName("Pozostalo_do_platnosci");
            entity.Property(e => e.StatusRozliczenia)
                .HasColumnType("enum('oplacona','nieoplacone','anulowane','zwrocone')")
                .HasColumnName("Status_rozliczenia");

            entity.HasOne(d => d.IdRezerwacjaNavigation).WithOne(p => p.Rozliczenie)
                .HasForeignKey<Rozliczenie>(d => d.IdRezerwacja)
                .HasConstraintName("fk_roz_rez");
        });

        modelBuilder.Entity<Sesja>(entity =>
        {
            entity.HasKey(e => e.IdSesja).HasName("PRIMARY");

            entity.ToTable("Sesja");

            entity.HasIndex(e => e.IdUzytkownik, "fk_sesja_aspnetuser");

            entity.HasIndex(e => e.TokenSesji, "uq_sesja__token").IsUnique();

            entity.Property(e => e.IdSesja)
                .HasColumnType("bigint(20) unsigned")
                .HasColumnName("ID_sesja");
            entity.Property(e => e.CzasStartu)
                .HasDefaultValueSql("current_timestamp()")
                .HasColumnType("datetime")
                .HasColumnName("Czas_startu");
            entity.Property(e => e.CzasZakonczenia)
                .HasColumnType("datetime")
                .HasColumnName("Czas_zakonczenia");
            entity.Property(e => e.IdUzytkownik).HasColumnName("ID_uzytkownik");
            entity.Property(e => e.TokenSesji)
                .HasMaxLength(64)
                .IsFixedLength()
                .HasColumnName("Token_sesji");

            entity.HasOne(d => d.IdUzytkownikNavigation).WithMany(p => p.Sesjas)
                .HasForeignKey(d => d.IdUzytkownik)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("fk_sesja_aspnetuser");
        });

        modelBuilder.Entity<Transport>(entity =>
        {
            entity.HasKey(e => e.IdTransport).HasName("PRIMARY");

            entity.ToTable("Transport");

            entity.Property(e => e.IdTransport)
                .HasColumnType("int(10) unsigned")
                .HasColumnName("ID_transport");
            entity.Property(e => e.RodzajTransportu)
                .HasMaxLength(100)
                .HasColumnName("Rodzaj_transportu");
        });

        modelBuilder.Entity<TransportOfertum>(entity =>
        {
            entity.HasKey(e => e.IdTransportOferta).HasName("PRIMARY");

            entity.ToTable("Transport_oferta");

            entity.HasIndex(e => e.IdTransport, "fk_transofe_trans");

            entity.HasIndex(e => new { e.IdOferta, e.IdTransport }, "uq_transport_oferta").IsUnique();

            entity.Property(e => e.IdTransportOferta)
                .HasColumnType("int(10) unsigned")
                .HasColumnName("ID_transport_oferta");
            entity.Property(e => e.GodzinaOdjazdu)
                .HasColumnType("time")
                .HasColumnName("Godzina_odjazdu");
            entity.Property(e => e.IdOferta)
                .HasColumnType("int(10) unsigned")
                .HasColumnName("ID_oferta");
            entity.Property(e => e.IdTransport)
                .HasColumnType("int(10) unsigned")
                .HasColumnName("ID_transport");
            entity.Property(e => e.IloscMiejsc)
                .HasColumnType("smallint(5) unsigned")
                .HasColumnName("Ilosc_miejsc");

            entity.HasOne(d => d.IdOfertaNavigation).WithMany(p => p.TransportOferta)
                .HasForeignKey(d => d.IdOferta)
                .HasConstraintName("fk_transofe_oferta");

            entity.HasOne(d => d.IdTransportNavigation).WithMany(p => p.TransportOferta)
                .HasForeignKey(d => d.IdTransport)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_transofe_trans");
        });

        modelBuilder.Entity<UczestnikRezerwacji>(entity =>
        {
            entity.HasKey(e => new { e.IdRezerwacja, e.IdKlient })
                .HasName("PRIMARY")
                .HasAnnotation("MySql:IndexPrefixLength", new[] { 0, 0 });

            entity.ToTable("Uczestnik_rezerwacji");

            entity.HasIndex(e => e.IdKlient, "fk_ucz_klient");

            entity.Property(e => e.IdRezerwacja)
                .HasColumnType("int(10) unsigned")
                .HasColumnName("ID_rezerwacja");
            entity.Property(e => e.IdKlient)
                .HasColumnType("int(10) unsigned")
                .HasColumnName("ID_klient");
            entity.Property(e => e.Rola)
                .HasDefaultValueSql("'UCZESTNIK'")
                .HasColumnType("enum('GLOWNY','UCZESTNIK','DZIECKO')");

            entity.HasOne(d => d.IdKlientNavigation).WithMany(p => p.UczestnikRezerwacjis)
                .HasForeignKey(d => d.IdKlient)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_ucz_klient");

            entity.HasOne(d => d.IdRezerwacjaNavigation).WithMany(p => p.UczestnikRezerwacjis)
                .HasForeignKey(d => d.IdRezerwacja)
                .HasConstraintName("fk_ucz_rez");
        });

        modelBuilder.Entity<Usluga>(entity =>
        {
            entity.HasKey(e => e.IdUsluga).HasName("PRIMARY");

            entity.ToTable("Usluga");

            entity.Property(e => e.IdUsluga)
                .HasColumnType("int(10) unsigned")
                .HasColumnName("ID_usluga");
            entity.Property(e => e.CenaBrutto)
                .HasPrecision(10, 2)
                .HasComputedColumnSql("round(`Cena_netto` * (1 + `Stawka_VAT` / 100),2)", false)
                .HasColumnName("Cena_brutto");
            entity.Property(e => e.CenaNetto)
                .HasPrecision(10, 2)
                .HasColumnName("Cena_netto");
            entity.Property(e => e.NazwaUslugi)
                .HasMaxLength(160)
                .HasColumnName("Nazwa_uslugi");
            entity.Property(e => e.StawkaVat)
                .HasPrecision(5, 2)
                .HasColumnName("Stawka_VAT");
        });

        modelBuilder.Entity<Wyzywienie>(entity =>
        {
            entity.HasKey(e => e.IdWyzywienie).HasName("PRIMARY");

            entity.ToTable("Wyzywienie");

            entity.HasIndex(e => e.RodzajWyzywienia, "uq_wyzywienie__rodzaj").IsUnique();

            entity.Property(e => e.IdWyzywienie)
                .HasColumnType("int(10) unsigned")
                .HasColumnName("ID_wyzywienie");
            entity.Property(e => e.RodzajWyzywienia)
                .HasMaxLength(100)
                .HasColumnName("Rodzaj_wyzywienia");
        });

        modelBuilder.Entity<Zdjecium>(entity =>
        {
            entity.HasKey(e => e.IdZdjecie).HasName("PRIMARY");

            entity.HasIndex(e => new { e.OpisZdjecia, e.Tagi }, "idx_fulltext_opis_tagi").HasAnnotation("MySql:FullTextIndex", true);

            entity.HasIndex(e => e.IdDestynacja, "idx_id_destynacja");

            entity.HasIndex(e => e.IdOsrodek, "idx_osrodek");

            entity.Property(e => e.IdZdjecie)
                .HasColumnType("int(10) unsigned")
                .HasColumnName("ID_zdjecie");
            entity.Property(e => e.CzyGlowne).HasColumnName("Czy_glowne");
            entity.Property(e => e.IdDestynacja)
                .HasColumnType("int(10) unsigned")
                .HasColumnName("id_destynacja");
            entity.Property(e => e.IdOsrodek)
                .HasColumnType("int(10) unsigned")
                .HasColumnName("ID_osrodek");
            entity.Property(e => e.OpisZdjecia).HasColumnName("Opis_zdjecia");
            entity.Property(e => e.SciezkaPliku)
                .HasMaxLength(255)
                .HasColumnName("Sciezka_pliku");
            entity.Property(e => e.Tagi)
                .HasMaxLength(500)
                .HasComment("Tagi oddzielone przecinkami");

            entity.HasOne(d => d.IdDestynacjaNavigation).WithMany(p => p.Zdjecia)
                .HasForeignKey(d => d.IdDestynacja)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("fk_zdjecie_destynacja");

            entity.HasOne(d => d.IdOsrodekNavigation).WithMany(p => p.Zdjecia)
                .HasForeignKey(d => d.IdOsrodek)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("fk_zdjecie_osrodek");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
