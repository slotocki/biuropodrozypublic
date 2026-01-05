// Controllers/offer/OsrodekController.cs
using BiuroTurystyczne1.Data.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BiuroTurystyczne1.Controllers.offer;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OsrodekController : ControllerBase
{
    private readonly BiuroDbContext _context;
    private readonly ILogger<OsrodekController> _logger;

    public OsrodekController(BiuroDbContext context, ILogger<OsrodekController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // GET: api/Osrodek
    [HttpGet]
    public async Task<IActionResult> GetOsrodki([FromQuery] string? search = null, [FromQuery] uint? idDestynacja = null)
    {
        var query = _context.Osrodeks
            .Include(o => o.IdDestynacjaNavigation)
            .Include(o => o.IdWyzywienieNavigation)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            search = search.ToLower();
            query = query.Where(o =>
                o.NazwaOsrodka.ToLower().Contains(search) ||
                (o.IdDestynacjaNavigation != null && o.IdDestynacjaNavigation.Nazwa.ToLower().Contains(search)) ||
                (o.Opis != null && o.Opis.ToLower().Contains(search))
            );
        }

        if (idDestynacja.HasValue)
        {
            query = query.Where(o => o.IdDestynacja == idDestynacja.Value);
        }

        var result = await query
            .OrderBy(o => o.NazwaOsrodka)
            .Select(o => new
            {
                o.IdOsrodek,
                o.NazwaOsrodka,
                Adres = string.Concat(o.Ulica ?? "", " ", o.Miejscowosc ?? "").Trim(),
                AdresPelny = new
                {
                    o.Ulica,
                    o.KodPocztowy,
                    o.Miejscowosc
                },
                o.Opis,
                o.Adnotacje,
                o.IdDestynacja,
                NazwaDestynacji = o.IdDestynacjaNavigation != null ? o.IdDestynacjaNavigation.Nazwa : null,
                o.IdWyzywienie,
                NazwaWyzywienia = o.IdWyzywienieNavigation != null ? o.IdWyzywienieNavigation.RodzajWyzywienia : null,
                // Główne zdjęcie
                GlowneZdjecie = _context.Zdjecia
                    .Where(z => z.IdOsrodek == o.IdOsrodek && z.CzyGlowne)
                    .Select(z => z.SciezkaPliku)
                    .FirstOrDefault(),
                LiczbaZdjec = _context.Zdjecia.Count(z => z.IdOsrodek == o.IdOsrodek),
                LiczbaPokoi = _context.Pokojs.Count(p => p.IdOsrodek == o.IdOsrodek),
                LiczbaDoplat = o.IdDoplata.Count()
            })
            .ToListAsync();

        return Ok(result);
    }

    // GET: api/Osrodek/5
    [HttpGet("{id}")]
    public async Task<IActionResult> GetOsrodek(uint id)
    {
        var osrodek = await _context.Osrodeks
            .Include(o => o.IdDestynacjaNavigation)
            .Include(o => o.IdWyzywienieNavigation)
            .Where(o => o.IdOsrodek == id)
            .Select(o => new
            {
                o.IdOsrodek,
                o.NazwaOsrodka,
                o.Ulica,
                o.KodPocztowy,
                o.Miejscowosc,
                o.Opis,
                o.Adnotacje,
                o.IdDestynacja,
                NazwaDestynacji = o.IdDestynacjaNavigation != null ? o.IdDestynacjaNavigation.Nazwa : null,
                o.IdWyzywienie,
                NazwaWyzywienia = o.IdWyzywienieNavigation != null ? o.IdWyzywienieNavigation.RodzajWyzywienia : null,
                GlowneZdjecie = _context.Zdjecia
                    .Where(z => z.IdOsrodek == o.IdOsrodek && z.CzyGlowne)
                    .Select(z => z.SciezkaPliku)
                    .FirstOrDefault(),
                LiczbaZdjec = _context.Zdjecia.Count(z => z.IdOsrodek == o.IdOsrodek),
                LiczbaPokoi = _context.Pokojs.Count(p => p.IdOsrodek == o.IdOsrodek)
            })
            .FirstOrDefaultAsync();

        if (osrodek == null) return NotFound();
        return Ok(osrodek);
    }

    // POST: api/Osrodek
    [HttpPost]
    public async Task<IActionResult> CreateOsrodek([FromBody] OsrodekDto dto)
    {
        var osrodek = new Osrodek
        {
            NazwaOsrodka = dto.NazwaOsrodka,
            IdDestynacja = dto.IdDestynacja,
            IdWyzywienie = dto.IdWyzywienie,
            Ulica = dto.Ulica,
            KodPocztowy = dto.KodPocztowy,
            Miejscowosc = dto.Miejscowosc,
            Opis = dto.Opis,
            Adnotacje = dto.Adnotacje
        };

        _context.Osrodeks.Add(osrodek);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetOsrodek), new { id = osrodek.IdOsrodek }, osrodek);
    }

    // PUT: api/Osrodek/5
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateOsrodek(uint id, [FromBody] OsrodekDto dto)
    {
        var osrodek = await _context.Osrodeks.FindAsync(id);
        if (osrodek == null) return NotFound();

        osrodek.NazwaOsrodka = dto.NazwaOsrodka;
        osrodek.IdDestynacja = dto.IdDestynacja;
        osrodek.IdWyzywienie = dto.IdWyzywienie;
        osrodek.Ulica = dto.Ulica;
        osrodek.KodPocztowy = dto.KodPocztowy;
        osrodek.Miejscowosc = dto.Miejscowosc;
        osrodek.Opis = dto.Opis;
        osrodek.Adnotacje = dto.Adnotacje;

        await _context.SaveChangesAsync();
        return Ok(new { message = "Ośrodek zaktualizowany." });
    }

    // DELETE: api/Osrodek/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteOsrodek(uint id)
    {
        var osrodek = await _context.Osrodeks.FindAsync(id);
        if (osrodek == null) return NotFound();

        // Sprawdź czy nie jest używany w ofertach
        var hasOffers = await _context.OfertaOsrodeks.AnyAsync(oo => oo.IdOsrodek == id);
        if (hasOffers)
        {
            return BadRequest(new { message = "Nie można usunąć ośrodka, który jest przypisany do ofert." });
        }

        _context.Osrodeks.Remove(osrodek);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Ośrodek usunięty." });
    }

    // GET: api/Osrodek/5/galeria
    [HttpGet("{id}/galeria")]
    public async Task<IActionResult> GetOsrodekGaleria(uint id)
    {
        var osrodek = await _context.Osrodeks.FindAsync(id);
        if (osrodek == null) return NotFound();

        var zdjecia = await _context.Zdjecia
            .Where(z => z.IdOsrodek == id)
            .OrderByDescending(z => z.CzyGlowne)
            .ThenBy(z => z.IdZdjecie)
            .Select(z => new
            {
                z.IdZdjecie,
                z.SciezkaPliku,
                z.OpisZdjecia,
                z.Tagi,
                z.CzyGlowne
            })
            .ToListAsync();

        return Ok(zdjecia);
    }
}

public class OsrodekDto
{
    public string NazwaOsrodka { get; set; } = null!;
    public uint IdDestynacja { get; set; }
    public uint IdWyzywienie { get; set; }
    public string? Ulica { get; set; }
    public string? KodPocztowy { get; set; }
    public string? Miejscowosc { get; set; }
    public string? Opis { get; set; }
    public string? Adnotacje { get; set; }
}
