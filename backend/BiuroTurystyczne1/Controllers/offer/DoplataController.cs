// Controllers/offer/DoplataController.cs
using BiuroTurystyczne1.Data.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BiuroTurystyczne1.Controllers.offer;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DoplataController : ControllerBase
{
    private readonly BiuroDbContext _context;

    public DoplataController(BiuroDbContext context)
    {
        _context = context;
    }

    // GET: api/Doplata?idOsrodek=5
    [HttpGet]
    public async Task<IActionResult> GetDoplaty([FromQuery] uint? idOsrodek = null)
    {
        if (idOsrodek.HasValue)
        {
            // Pobierz dopłaty dla konkretnego ośrodka
            var osrodek = await _context.Osrodeks
                .Include(o => o.IdDoplata)
                .FirstOrDefaultAsync(o => o.IdOsrodek == idOsrodek.Value);

            if (osrodek == null) return NotFound();

            var doplaty = osrodek.IdDoplata.Select(d => new
            {
                d.IdDoplata,
                d.NazwaDoplaty,
                d.KwotaDoplaty,
                IdOsrodek = idOsrodek.Value
            }).ToList();

            return Ok(doplaty);
        }

        // Pobierz wszystkie dopłaty
        var allDoplaty = await _context.Doplata
            .Select(d => new
            {
                d.IdDoplata,
                d.NazwaDoplaty,
                d.KwotaDoplaty
            })
            .ToListAsync();

        return Ok(allDoplaty);
    }

    // GET: api/Doplata/5
    [HttpGet("{id}")]
    public async Task<IActionResult> GetDoplata(uint id)
    {
        var doplata = await _context.Doplata.FindAsync(id);
        if (doplata == null) return NotFound();
        return Ok(doplata);
    }

    // POST: api/Doplata
    [HttpPost]
    public async Task<IActionResult> CreateDoplata([FromBody] DoplataDto dto)
    {
        var doplata = new Doplatum
        {
            NazwaDoplaty = dto.NazwaDoplaty,
            KwotaDoplaty = dto.KwotaDoplaty
        };

        _context.Doplata.Add(doplata);
        await _context.SaveChangesAsync();

        // Powiąż z ośrodkiem jeśli podano
        if (dto.IdOsrodek.HasValue)
        {
            var osrodek = await _context.Osrodeks
                .Include(o => o.IdDoplata)
                .FirstOrDefaultAsync(o => o.IdOsrodek == dto.IdOsrodek.Value);

            if (osrodek != null)
            {
                osrodek.IdDoplata.Add(doplata);
                await _context.SaveChangesAsync();
            }
        }

        return CreatedAtAction(nameof(GetDoplata), new { id = doplata.IdDoplata }, doplata);
    }

    // PUT: api/Doplata/5
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateDoplata(uint id, [FromBody] DoplataDto dto)
    {
        var doplata = await _context.Doplata.FindAsync(id);
        if (doplata == null) return NotFound();

        doplata.NazwaDoplaty = dto.NazwaDoplaty;
        doplata.KwotaDoplaty = dto.KwotaDoplaty;

        await _context.SaveChangesAsync();
        return Ok(new { message = "Dopłata zaktualizowana." });
    }

    // DELETE: api/Doplata/5?idOsrodek=3
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteDoplata(uint id, [FromQuery] uint? idOsrodek = null)
    {
        if (idOsrodek.HasValue)
        {
            // Usuń tylko powiązanie z ośrodkiem
            var osrodek = await _context.Osrodeks
                .Include(o => o.IdDoplata)
                .FirstOrDefaultAsync(o => o.IdOsrodek == idOsrodek.Value);

            if (osrodek != null)
            {
                var doplata = osrodek.IdDoplata.FirstOrDefault(d => d.IdDoplata == id);
                if (doplata != null)
                {
                    osrodek.IdDoplata.Remove(doplata);
                    await _context.SaveChangesAsync();
                }
            }
        }
        else
        {
            // Usuń całą dopłatę
            var doplata = await _context.Doplata.FindAsync(id);
            if (doplata == null) return NotFound();

            _context.Doplata.Remove(doplata);
            await _context.SaveChangesAsync();
        }

        return Ok(new { message = "Dopłata usunięta." });
    }
}

public class DoplataDto
{
    public string NazwaDoplaty { get; set; } = null!;
    public decimal KwotaDoplaty { get; set; }
    public uint? IdOsrodek { get; set; }
}
