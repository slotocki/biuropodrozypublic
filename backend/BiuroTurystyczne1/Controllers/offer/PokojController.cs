// Controllers/offer/PokojController.cs
using BiuroTurystyczne1.Data.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BiuroTurystyczne1.Controllers.offer;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PokojController : ControllerBase
{
    private readonly BiuroDbContext _context;
    private readonly ILogger<PokojController> _logger;

    public PokojController(BiuroDbContext context, ILogger<PokojController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // GET: api/Pokoj?idOsrodek=5
    [HttpGet]
    public async Task<IActionResult> GetPokoje([FromQuery] uint? idOsrodek = null, [FromQuery] uint? idRodzaj = null)
    {
        var query = _context.Pokojs
            .Include(p => p.IdRodzajPokojuNavigation)
            .AsQueryable();

        if (idOsrodek.HasValue)
        {
            query = query.Where(p => p.IdOsrodek == idOsrodek.Value);
        }

        if (idRodzaj.HasValue)
        {
            query = query.Where(p => p.IdRodzajPokoju == idRodzaj.Value);
        }

        var result = await query
            .OrderBy(p => p.NumerPokoju ?? "")
            .ThenBy(p => p.IdPokoj)
            .Select(p => new
            {
                p.IdPokoj,
                p.IdOsrodek,
                p.NumerPokoju,
                p.OpisPokoju,
                p.IdRodzajPokoju,
                RodzajPokoju = p.IdRodzajPokojuNavigation != null ? p.IdRodzajPokojuNavigation.RodzajPokoju : null,
                p.IloscLozek,
                p.IloscOsob,
                p.MaxIloscOsob
            })
            .ToListAsync();

        return Ok(result);
    }

    // GET: api/Pokoj/5
    [HttpGet("{id}")]
    public async Task<IActionResult> GetPokoj(uint id)
    {
        var pokoj = await _context.Pokojs
            .Include(p => p.IdRodzajPokojuNavigation)
            .Where(p => p.IdPokoj == id)
            .Select(p => new
            {
                p.IdPokoj,
                p.IdOsrodek,
                p.NumerPokoju,
                p.OpisPokoju,
                p.IdRodzajPokoju,
                RodzajPokoju = p.IdRodzajPokojuNavigation != null ? p.IdRodzajPokojuNavigation.RodzajPokoju : null,
                p.IloscLozek,
                p.IloscOsob,
                p.MaxIloscOsob
            })
            .FirstOrDefaultAsync();

        if (pokoj == null) return NotFound();
        return Ok(pokoj);
    }

    // POST: api/Pokoj
    [HttpPost]
    public async Task<IActionResult> CreatePokoj([FromBody] PokojDto dto)
    {
        var pokoj = new Pokoj
        {
            IdOsrodek = dto.IdOsrodek,
            IdRodzajPokoju = dto.IdRodzajPokoju,
            NumerPokoju = string.IsNullOrWhiteSpace(dto.NumerPokoju) ? null : dto.NumerPokoju,
            OpisPokoju = string.IsNullOrWhiteSpace(dto.OpisPokoju) ? null : dto.OpisPokoju,
            IloscLozek = dto.IloscLozek,
            IloscOsob = dto.IloscOsob,
            MaxIloscOsob = dto.MaxIloscOsob
        };

        _context.Pokojs.Add(pokoj);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetPokoj), new { id = pokoj.IdPokoj }, pokoj);
    }

    // POST: api/Pokoj/bulk (dodawanie wielu pokoi naraz)
    [HttpPost("bulk")]
    public async Task<IActionResult> CreatePokojeBulk([FromBody] PokojBulkDto dto)
    {
        if (dto.LiczbaPokoi <= 0 || dto.LiczbaPokoi > 500)
        {
            return BadRequest(new { message = "Liczba pokoi musi być między 1 a 500." });
        }

        var rodzaj = await _context.PokojRodzajs.FindAsync(dto.IdRodzajPokoju);
        if (rodzaj == null)
        {
            return BadRequest(new { message = "Nie znaleziono rodzaju pokoju." });
        }

        // Wymagane wartości - brak domyślnych
        if (!dto.IloscLozek.HasValue || !dto.IloscOsob.HasValue || !dto.MaxIloscOsob.HasValue)
        {
            return BadRequest(new { message = "Podaj ilość łóżek, osób i max osób." });
        }

        var pokoje = new List<Pokoj>();

        for (int i = 0; i < dto.LiczbaPokoi; i++)
        {
            var pokoj = new Pokoj
            {
                IdOsrodek = dto.IdOsrodek,
                IdRodzajPokoju = dto.IdRodzajPokoju,
                NumerPokoju = null,
                OpisPokoju = string.IsNullOrWhiteSpace(dto.OpisPokoju) ? null : dto.OpisPokoju,
                IloscLozek = dto.IloscLozek.Value,
                IloscOsob = dto.IloscOsob.Value,
                MaxIloscOsob = dto.MaxIloscOsob.Value
            };

            pokoje.Add(pokoj);
        }

        _context.Pokojs.AddRange(pokoje);
        await _context.SaveChangesAsync();

        return Ok(new 
        { 
            message = $"Dodano {dto.LiczbaPokoi} pokoi.",
            liczbaPokoi = dto.LiczbaPokoi 
        });
    }

    // PUT: api/Pokoj/5
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdatePokoj(uint id, [FromBody] PokojDto dto)
    {
        var pokoj = await _context.Pokojs.FindAsync(id);
        if (pokoj == null) return NotFound();

        pokoj.IdRodzajPokoju = dto.IdRodzajPokoju;
        pokoj.NumerPokoju = string.IsNullOrWhiteSpace(dto.NumerPokoju) ? null : dto.NumerPokoju;
        pokoj.OpisPokoju = string.IsNullOrWhiteSpace(dto.OpisPokoju) ? null : dto.OpisPokoju;
        pokoj.IloscLozek = dto.IloscLozek;
        pokoj.IloscOsob = dto.IloscOsob;
        pokoj.MaxIloscOsob = dto.MaxIloscOsob;

        await _context.SaveChangesAsync();
        return Ok(new { message = "Pokój zaktualizowany." });
    }

    // DELETE: api/Pokoj/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeletePokoj(uint id)
    {
        var pokoj = await _context.Pokojs.FindAsync(id);
        if (pokoj == null) return NotFound();

        // Sprawdź czy nie jest przypisany do ofert
        var hasOffers = await _context.PokojOferta.AnyAsync(po => po.IdPokoj == id);
        if (hasOffers)
        {
            return BadRequest(new { message = "Nie można usunąć pokoju, który jest przypisany do ofert." });
        }

        _context.Pokojs.Remove(pokoj);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Pokój usunięty." });
    }

    // DELETE: api/Pokoj/bulk?idOsrodek=5&idRodzaj=2
    [HttpDelete("bulk")]
    public async Task<IActionResult> DeletePokojeBulk([FromQuery] uint idOsrodek, [FromQuery] uint? idRodzaj = null)
    {
        var query = _context.Pokojs.Where(p => p.IdOsrodek == idOsrodek);

        if (idRodzaj.HasValue)
        {
            query = query.Where(p => p.IdRodzajPokoju == idRodzaj.Value);
        }

        var pokoje = await query.ToListAsync();
        var pokojeIds = pokoje.Select(p => p.IdPokoj).ToList();

        // Sprawdź czy nie są przypisane do ofert
        var hasOffers = await _context.PokojOferta
            .AnyAsync(po => pokojeIds.Contains(po.IdPokoj));

        if (hasOffers)
        {
            return BadRequest(new { message = "Nie można usunąć pokoi, które są przypisane do ofert." });
        }

        _context.Pokojs.RemoveRange(pokoje);
        await _context.SaveChangesAsync();

        return Ok(new { message = $"Usunięto {pokoje.Count} pokoi." });
    }
}

public class PokojDto
{
    public uint IdOsrodek { get; set; }
    public uint IdRodzajPokoju { get; set; }
    public string? NumerPokoju { get; set; }
    public string? OpisPokoju { get; set; }
    public byte IloscLozek { get; set; }
    public byte IloscOsob { get; set; }
    public byte MaxIloscOsob { get; set; }
}

public class PokojBulkDto
{
    public uint IdOsrodek { get; set; }
    public uint IdRodzajPokoju { get; set; }
    public int LiczbaPokoi { get; set; }
    public string? OpisPokoju { get; set; }
    public byte? IloscLozek { get; set; }
    public byte? IloscOsob { get; set; }
    public byte? MaxIloscOsob { get; set; }
}
