// Controllers/offer/PromocjeController.cs
using BiuroTurystyczne1.Data.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BiuroTurystyczne1.Controllers.offer;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PromocjaController : ControllerBase
{
    private readonly BiuroDbContext _context;
    private readonly ILogger<PromocjaController> _logger;

    public PromocjaController(BiuroDbContext context, ILogger<PromocjaController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // GET: api/Promocje
    [HttpGet]
    public async Task<IActionResult> GetPromocje([FromQuery] string? search = null)
    {
        var query = _context.Promocjas.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            search = search.ToLower();
            query = query.Where(p =>
                p.NazwaPromocji.ToLower().Contains(search) ||
                (p.Opis != null && p.Opis.ToLower().Contains(search))
            );
        }

        var result = await query
            .OrderByDescending(p => p.DataOd)
            .Select(p => new
            {
                p.IdPromocja,
                p.NazwaPromocji,
                p.Opis,
                p.DataOd,
                p.DataDo,
                p.KwotaZnizki,
                p.ProcentZnizki,
                CzyAktywna = p.DataOd <= DateOnly.FromDateTime(DateTime.Now) && 
                             p.DataDo >= DateOnly.FromDateTime(DateTime.Now)
            })
            .ToListAsync();

        return Ok(result);
    }

    // GET: api/Promocje/5
    [HttpGet("{id}")]
    public async Task<IActionResult> GetPromocja(uint id)
    {
        var promocja = await _context.Promocjas.FindAsync(id);
        if (promocja == null) return NotFound();
        return Ok(promocja);
    }

    // POST: api/Promocje
    [HttpPost]
    public async Task<IActionResult> CreatePromocja([FromBody] PromocjaDto dto)
    {
        // ✅ Walidacja - musi być kwota LUB procent
        if (!dto.KwotaZnizki.HasValue && !dto.ProcentZnizki.HasValue)
        {
            return BadRequest(new { message = "Musisz podać kwotę lub procent zniżki." });
        }

        // ✅ Walidacja dat
        if (dto.DataOd >= dto.DataDo)
        {
            return BadRequest(new { message = "Data zakończenia musi być późniejsza niż data rozpoczęcia." });
        }

        var promocja = new Promocja
        {
            NazwaPromocji = dto.NazwaPromocji,
            Opis = dto.Opis,
            DataOd = dto.DataOd,
            DataDo = dto.DataDo,
            KwotaZnizki = dto.KwotaZnizki,
            ProcentZnizki = dto.ProcentZnizki
        };

        _context.Promocjas.Add(promocja);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetPromocja), new { id = promocja.IdPromocja }, promocja);
    }

    // PUT: api/Promocje/5
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdatePromocja(uint id, [FromBody] PromocjaDto dto)
    {
        var promocja = await _context.Promocjas.FindAsync(id);
        if (promocja == null) return NotFound();

        // ✅ Walidacja
        if (!dto.KwotaZnizki.HasValue && !dto.ProcentZnizki.HasValue)
        {
            return BadRequest(new { message = "Musisz podać kwotę lub procent zniżki." });
        }

        if (dto.DataOd >= dto.DataDo)
        {
            return BadRequest(new { message = "Data zakończenia musi być późniejsza niż data rozpoczęcia." });
        }

        promocja.NazwaPromocji = dto.NazwaPromocji;
        promocja.Opis = dto.Opis;
        promocja.DataOd = dto.DataOd;
        promocja.DataDo = dto.DataDo;
        promocja.KwotaZnizki = dto.KwotaZnizki;
        promocja.ProcentZnizki = dto.ProcentZnizki;

        await _context.SaveChangesAsync();
        return Ok(new { message = "Promocja zaktualizowana." });
    }

    // DELETE: api/Promocje/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeletePromocja(uint id)
    {
        var promocja = await _context.Promocjas.FindAsync(id);
        if (promocja == null) return NotFound();

        _context.Promocjas.Remove(promocja);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Promocja usunięta." });
    }
}

// DTO
public class PromocjaDto
{
    public string NazwaPromocji { get; set; } = null!;
    public string? Opis { get; set; }
    public DateOnly DataOd { get; set; }
    public DateOnly DataDo { get; set; }
    public decimal? KwotaZnizki { get; set; }
    public decimal? ProcentZnizki { get; set; }
}
