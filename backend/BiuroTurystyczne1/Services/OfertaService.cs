using BiuroTurystyczne1.Data.DTOs;
using BiuroTurystyczne1.Data.Models;
using Microsoft.EntityFrameworkCore;

namespace BiuroTurystyczne1.Services;

public class OfertaService
{
    private readonly BiuroDbContext _context;
    private readonly ILogger<OfertaService> _logger;

    public OfertaService(BiuroDbContext context, ILogger<OfertaService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<uint> CalculateWolneMiejscaAsync(uint idOferta)
    {
        try
        {
            var oferta = await _context.Oferta.FirstOrDefaultAsync(o => o.IdOferta == idOferta);

            if (oferta == null)
                return 0;

            var zajeteTransport = await _context.Rezerwacjas
                .Where(r => r.IdOferta == idOferta && r.StatusRezerwacji != "ANULOWANA")
                .CountAsync();

            var wolneTransport = (int)oferta.IloscMiejscTransport - zajeteTransport;

            var pokojeDostepne = await _context.PokojOferta
                .Where(po => po.IdOferta == idOferta)
                .Select(po => po.IdPokoj)
                .ToListAsync();

            var pokojeZajete = await _context.Rezerwacjas
                .Where(r => r.IdOferta == idOferta && r.StatusRezerwacji != "ANULOWANA")
                .SelectMany(r => r.IdPokojs)
                .Where(p => pokojeDostepne.Contains(p.IdPokoj))
                .Select(p => p.IdPokoj)
                .Distinct()
                .CountAsync();

            var wolnePokoje = pokojeDostepne.Count - pokojeZajete;
            var wolneMiejsca = Math.Max(0, Math.Min(wolneTransport, wolnePokoje));
            return (uint)wolneMiejsca;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Błąd podczas obliczania wolnych miejsc dla oferty {IdOferta}", idOferta);
            return 0;
        }
    }

    public async Task<decimal> GetMinCenaAsync(uint idOferta)
    {
        var minCena = await _context.OfertaOsrodeks
            .Where(oo => oo.IdOferta == idOferta)
            .MinAsync(oo => (decimal?)oo.CenaOs);

        return minCena ?? 0;
    }

    public int CalculateIloscNoclegow(DateOnly terminOd, DateOnly terminDo)
    {
        return terminDo.DayNumber - terminOd.DayNumber;
    }

    public async Task<List<OfertaSummaryDto>> GetOfertySummaryAsync(OfertaSearchDto searchParams)
    {
        var query = _context.Oferta
            .Include(o => o.IdNazwaHandlowaNavigation)
            .Include(o => o.IdDestynacjaNavigation)
            .Include(o => o.OfertaOsrodeks)
            .Include(o => o.TransportOferta)
                .ThenInclude(to => to.IdTransportNavigation)
            .AsQueryable();

        if (searchParams.TylkoAktywne)
            query = query.Where(o => o.CzyAktywna == true);

        if (searchParams.IdDestynacja.HasValue)
            query = query.Where(o => o.IdDestynacja == searchParams.IdDestynacja.Value);

        if (searchParams.TerminOd.HasValue)
            query = query.Where(o => o.TerminOd >= searchParams.TerminOd.Value);

        if (searchParams.TerminDo.HasValue)
            query = query.Where(o => o.TerminDo <= searchParams.TerminDo.Value);

        // Szukanie po nazwie handlowej, opisie, nazwie ośrodka
        if (!string.IsNullOrWhiteSpace(searchParams.Search))
        {
            var searchTerm = searchParams.Search.Trim();

            query = query.Where(o =>
                (o.IdNazwaHandlowaNavigation != null && o.IdNazwaHandlowaNavigation.NazwaHandlowa1.Contains(searchTerm)) ||
                (o.Opis != null && o.Opis.Contains(searchTerm)) ||
                o.OfertaOsrodeks.Any(oo => oo.IdOsrodekNavigation.NazwaOsrodka.Contains(searchTerm))
            );
        }

        var oferty = await query
            .OrderBy(o => o.TerminOd)
            .ToListAsync();

        var result = new List<OfertaSummaryDto>();

        foreach (var oferta in oferty)
        {
            var minCena = await GetMinCenaAsync(oferta.IdOferta);
            var wolneMiejsca = await CalculateWolneMiejscaAsync(oferta.IdOferta);

            if (searchParams.CenaMax.HasValue && minCena > searchParams.CenaMax.Value)
                continue;

            var rodzajTransportu = oferta.TransportOferta.FirstOrDefault()?.IdTransportNavigation?.RodzajTransportu;

            result.Add(new OfertaSummaryDto
            {
                IdOferta = oferta.IdOferta,
                IdNazwaHandlowa = oferta.IdNazwaHandlowa,
                NazwaHandlowa = oferta.IdNazwaHandlowaNavigation?.NazwaHandlowa1 ?? "",
                IdDestynacja = oferta.IdDestynacja,
                NazwaDestynacji = oferta.IdDestynacjaNavigation?.Nazwa,
                TerminOd = oferta.TerminOd,
                TerminDo = oferta.TerminDo,
                CenaOd = minCena,
                WolneMiejsca = wolneMiejsca,
                RodzajTransportu = rodzajTransportu,
                CzyAktywna = oferta.CzyAktywna ?? true
            });
        }
        return result;
    }

    public async Task<OfertaDetailDto?> GetOfertaDetailAsync(uint idOferta)
    {
        var oferta = await _context.Oferta
            .Include(o => o.IdNazwaHandlowaNavigation)
            .Include(o => o.IdDestynacjaNavigation)
            .Include(o => o.OfertaOsrodeks)
                .ThenInclude(oo => oo.IdOsrodekNavigation)
                    .ThenInclude(osr => osr.IdWyzywienieNavigation)
            .Include(o => o.OfertaOsrodeks)
                .ThenInclude(oo => oo.IdOsrodekNavigation)
                    .ThenInclude(osr => osr.IdDoplata)
            .Include(o => o.PokojOferta)
                .ThenInclude(po => po.IdPokojNavigation)
                    .ThenInclude(p => p.IdRodzajPokojuNavigation)
            .Include(o => o.IdMiejsces)
            .Include(o => o.TransportOferta)
                .ThenInclude(to => to.IdTransportNavigation)
            .FirstOrDefaultAsync(o => o.IdOferta == idOferta);

        if (oferta == null)
            return null;

        var wolneMiejsca = await CalculateWolneMiejscaAsync(idOferta);
        var iloscNoclegow = CalculateIloscNoclegow(oferta.TerminOd, oferta.TerminDo);

        var osrodkiDto = new List<OfertaOsrodekDto>();
        foreach (var oo in oferta.OfertaOsrodeks)
        {
            var osrodek = oo.IdOsrodekNavigation;
            var pokoje = await _context.PokojOferta
                .Where(po => po.IdOferta == idOferta && po.IdPokojNavigation.IdOsrodek == osrodek.IdOsrodek)
                .Include(po => po.IdPokojNavigation)
                    .ThenInclude(p => p.IdRodzajPokojuNavigation)
                .ToListAsync();

            var pokojeDto = new List<PokojSummaryDto>();
            foreach (var pokojOferta in pokoje)
            {
                var p = pokojOferta.IdPokojNavigation;
                var czyZajety = await _context.Rezerwacjas
                    .Where(r => r.IdOferta == idOferta && r.StatusRezerwacji != "ANULOWANA")
                    .AnyAsync(r => r.IdPokojs.Any(rp => rp.IdPokoj == p.IdPokoj));

                pokojeDto.Add(new PokojSummaryDto
                {
                    IdPokoj = p.IdPokoj,
                    NumerPokoju = p.NumerPokoju,
                    RodzajPokoju = p.IdRodzajPokojuNavigation?.RodzajPokoju,
                    IloscOsob = p.IloscOsob,
                    MaxIloscOsob = p.MaxIloscOsob,
                    CzyZajety = czyZajety
                });
            }

            osrodkiDto.Add(new OfertaOsrodekDto
            {
                IdOsrodek = osrodek.IdOsrodek,
                NazwaOsrodka = osrodek.NazwaOsrodka,
                Adres = $"{osrodek.Ulica}, {osrodek.KodPocztowy} {osrodek.Miejscowosc}",
                CenaOs = oo.CenaOs ?? 0m,
                RodzajWyzywienia = osrodek.IdWyzywienieNavigation?.RodzajWyzywienia,
                Opis = osrodek.Opis,
                Adnotacje = osrodek.Adnotacje,
                Pokoje = pokojeDto
            });
        }

        var doplatyDto = oferta.OfertaOsrodeks
            .SelectMany(oo => oo.IdOsrodekNavigation.IdDoplata)
            .Distinct()
            .Select(d => new DoplataSummaryDto
            {
                IdDoplata = d.IdDoplata,
                NazwaDoplaty = d.NazwaDoplaty,
                KwotaDoplaty = d.KwotaDoplaty
            })
            .ToList();

        var transportyDto = oferta.TransportOferta
            .Select(to => new TransportOfertaDto
            {
                IdTransport = to.IdTransport,
                RodzajTransportu = to.IdTransportNavigation?.RodzajTransportu ?? "Nieznany",
                IloscMiejsc = oferta.IloscMiejscTransport
            })
            .ToList();

        return new OfertaDetailDto
        {
            IdOferta = oferta.IdOferta,
            IdNazwaHandlowa = oferta.IdNazwaHandlowa,
            NazwaHandlowa = oferta.IdNazwaHandlowaNavigation?.NazwaHandlowa1 ?? "",
            Opis = oferta.Opis,
            IdDestynacja = oferta.IdDestynacja,
            NazwaDestynacji = oferta.IdDestynacjaNavigation?.Nazwa,
            TerminOd = oferta.TerminOd,
            TerminDo = oferta.TerminDo,
            DataZakwaterowania = oferta.DataZakwaterowania,
            DataWykwaterowania = oferta.DataWykwaterowania,
            IloscMiejscTransport = oferta.IloscMiejscTransport,
            IloscMiejscPokoje = oferta.IloscMiejscPokoje,
            WolneMiejsca = wolneMiejsca,
            IloscNoclegow = iloscNoclegow,
            CzyAktywna = oferta.CzyAktywna ?? false,
            Osrodki = osrodkiDto,
            Transporty = transportyDto,
            MiejscaOdjazdu = oferta.IdMiejsces.Select(m => new MiejsceOdjazdDto
            {
                IdMiejsce = m.IdMiejsce,
                NazwaMiejsca = m.NazwaMiejsca,
                Adres = m.Adres,
                Opis = m.Opis
            }).ToList(),
            Doplaty = doplatyDto
        };
    }

    public async Task<uint> CreateOfertaAsync(OfertaCreateDto dto)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var nazwa = await _context.NazwaHandlowas.FindAsync(dto.IdNazwaHandlowa);
            if (nazwa == null)
                throw new Exception("Nie znaleziono nazwy handlowej");

            var oferta = new Ofertum
            {
                IdNazwaHandlowa = dto.IdNazwaHandlowa,
                Opis = dto.Opis,
                IdDestynacja = dto.IdDestynacja,
                TerminOd = dto.TerminOd,
                TerminDo = dto.TerminDo,
                DataZakwaterowania = dto.DataZakwaterowania,
                DataWykwaterowania = dto.DataWykwaterowania,
                IloscMiejscTransport = dto.IloscMiejscTransport,
                IloscMiejscPokoje = (uint)dto.Osrodki.Sum(o => o.IdPokoje.Count),
                CzyAktywna = true
            };

            _context.Oferta.Add(oferta);
            await _context.SaveChangesAsync();

            foreach (var osrodekDto in dto.Osrodki)
            {
                var ofertaOsrodek = new OfertaOsrodek
                {
                    IdOferta = oferta.IdOferta,
                    IdOsrodek = osrodekDto.IdOsrodek,
                    CenaOs = osrodekDto.CenaOs
                };
                _context.OfertaOsrodeks.Add(ofertaOsrodek);

                foreach (var idPokoj in osrodekDto.IdPokoje)
                {
                    var pokojOferta = new PokojOfertum
                    {
                        IdOferta = oferta.IdOferta,
                        IdPokoj = idPokoj
                    };
                    _context.PokojOferta.Add(pokojOferta);
                }
            }

            foreach (var idTransport in dto.IdTransporty)
            {
                var transportOferta = new TransportOfertum
                {
                    IdOferta = oferta.IdOferta,
                    IdTransport = idTransport
                };
                _context.TransportOferta.Add(transportOferta);
            }

            foreach (var idMiejsce in dto.IdMiejscaOdjazdu)
            {
                var miejsce = await _context.MiejsceOdjazdus.FindAsync(idMiejsce);
                if (miejsce != null)
                {
                    oferta.IdMiejsces.Add(miejsce);
                }
            }

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            _logger.LogInformation("Utworzono ofertę: {IdOferta}", oferta.IdOferta);
            return oferta.IdOferta;
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "Błąd podczas tworzenia oferty");
            throw;
        }
    }

    public async Task<bool> UpdateOfertaAsync(OfertaUpdateDto dto)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var oferta = await _context.Oferta
                .Include(o => o.OfertaOsrodeks)
                .Include(o => o.PokojOferta)
                .Include(o => o.TransportOferta)
                .Include(o => o.IdMiejsces)
                .FirstOrDefaultAsync(o => o.IdOferta == dto.IdOferta);

            if (oferta == null)
                return false;

            oferta.IdNazwaHandlowa = dto.IdNazwaHandlowa;
            oferta.Opis = dto.Opis;
            oferta.IdDestynacja = dto.IdDestynacja;
            oferta.TerminOd = dto.TerminOd;
            oferta.TerminDo = dto.TerminDo;
            oferta.DataZakwaterowania = dto.DataZakwaterowania;
            oferta.DataWykwaterowania = dto.DataWykwaterowania;
            oferta.IloscMiejscTransport = dto.IloscMiejscTransport;

            _context.OfertaOsrodeks.RemoveRange(oferta.OfertaOsrodeks);
            _context.PokojOferta.RemoveRange(oferta.PokojOferta);

            var iloscMiejscPokoje = 0;
            foreach (var osrodekDto in dto.Osrodki)
            {
                var ofertaOsrodek = new OfertaOsrodek
                {
                    IdOferta = oferta.IdOferta,
                    IdOsrodek = osrodekDto.IdOsrodek,
                    CenaOs = osrodekDto.CenaOs
                };
                _context.OfertaOsrodeks.Add(ofertaOsrodek);

                foreach (var idPokoj in osrodekDto.IdPokoje)
                {
                    var pokojOferta = new PokojOfertum
                    {
                        IdOferta = oferta.IdOferta,
                        IdPokoj = idPokoj
                    };
                    _context.PokojOferta.Add(pokojOferta);
                    iloscMiejscPokoje++;
                }
            }

            oferta.IloscMiejscPokoje = (uint)iloscMiejscPokoje;

            _context.TransportOferta.RemoveRange(oferta.TransportOferta);
            foreach (var idTransport in dto.IdTransporty)
            {
                var transportOferta = new TransportOfertum
                {
                    IdOferta = oferta.IdOferta,
                    IdTransport = idTransport
                };
                _context.TransportOferta.Add(transportOferta);
            }

            oferta.IdMiejsces.Clear();
            foreach (var idMiejsce in dto.IdMiejscaOdjazdu)
            {
                var miejsce = await _context.MiejsceOdjazdus.FindAsync(idMiejsce);
                if (miejsce != null)
                {
                    oferta.IdMiejsces.Add(miejsce);
                }
            }

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
            _logger.LogInformation("Zaktualizowano ofertę ID: {IdOferta}", dto.IdOferta);
            return true;
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "Błąd podczas aktualizacji oferty {IdOferta}", dto.IdOferta);
            throw;
        }
    }

    public async Task<bool> ArchiveOfertaAsync(uint idOferta)
    {
        var oferta = await _context.Oferta.FindAsync(idOferta);
        if (oferta == null)
            return false;

        oferta.CzyAktywna = false;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Zarchiwizowano ofertę ID: {IdOferta}", idOferta);
        return true;
    }

    public async Task<bool> RestoreOfertaAsync(uint idOferta)
    {
        var oferta = await _context.Oferta.FindAsync(idOferta);
        if (oferta == null)
            return false;

        oferta.CzyAktywna = true;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Przywrócono ofertę ID: {IdOferta}", idOferta);
        return true;
    }
}
