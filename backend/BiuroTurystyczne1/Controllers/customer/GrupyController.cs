using BiuroTurystyczne1.Data.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BiuroTurystyczne1.Controllers.customer;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class GrupyController : ControllerBase
{
    private readonly BiuroDbContext _context;
    private readonly ILogger<GrupyController> _logger;

    public GrupyController(BiuroDbContext context, ILogger<GrupyController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // GET: api/grupy
    [HttpGet]
    public async Task<IActionResult> GetGrupy()
    {
        var grupy = await _context.Grupas
            .Select(g => new
            {
                g.IdGrupa,
                g.NazwaGrupy,
                g.OpiekunGrupy,
                g.TelefonOpiekuna,
                g.Adnotacje,
                IloscCzlonkow = g.Klients.Count,
                IloscWystapien = g.Rezerwacjas.Count
            })
            .ToListAsync();

        return Ok(grupy);
    }

    // GET: api/grupy/5
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetGrupa(int id)
    {
        var grupa = await _context.Grupas
            .Include(g => g.Klients)
            .FirstOrDefaultAsync(g => g.IdGrupa == id);

        if (grupa == null)
            return NotFound(new { message = "Nie znaleziono grupy." });

        var result = new
        {
            grupa.IdGrupa,
            grupa.NazwaGrupy,
            grupa.OpiekunGrupy,
            grupa.TelefonOpiekuna,
            grupa.Adnotacje,
            Klienci = grupa.Klients.Select(k => new
            {
                k.IdKlient,
                k.Imie,
                k.Nazwisko,
                k.Email,
                k.Telefon
            })
        };

        return Ok(result);
    }

    // POST: api/grupy
    [HttpPost]
    public async Task<IActionResult> CreateGrupa([FromBody] Grupa grupa)
    {
        // Walidacja unikalności nazwy grupy
        var existingName = await _context.Grupas
            .AnyAsync(g => g.NazwaGrupy == grupa.NazwaGrupy);

        if (existingName)
            return BadRequest(new { message = "Grupa o tej nazwie już istnieje." });

        _context.Grupas.Add(grupa);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetGrupa), new { id = grupa.IdGrupa }, grupa);
    }

    // PUT: api/grupy/5
    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateGrupa(int id, [FromBody] Grupa grupa)
    {
        if (id != grupa.IdGrupa)
            return BadRequest(new { message = "ID w URL nie zgadza się z ID w obiekcie." });

        // Walidacja unikalności nazwy (wykluczając edytowaną grupę)
        var existingName = await _context.Grupas
            .AnyAsync(g => g.NazwaGrupy == grupa.NazwaGrupy && g.IdGrupa != id);

        if (existingName)
            return BadRequest(new { message = "Inna grupa o tej nazwie już istnieje." });

        _context.Entry(grupa).State = EntityState.Modified;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!await _context.Grupas.AnyAsync(g => g.IdGrupa == id))
                return NotFound();
            throw;
        }

        return NoContent();
    }

    // DELETE: api/grupy/5
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteGrupa(int id)
    {
        var grupa = await _context.Grupas
            .Include(g => g.Klients)
            .Include(g => g.Rezerwacjas)
            .FirstOrDefaultAsync(g => g.IdGrupa == id);

        if (grupa == null)
            return NotFound(new { message = "Nie znaleziono grupy." });

        // Sprawdź czy grupa ma rezerwacje
        if (grupa.Rezerwacjas.Any())
        {
            return BadRequest(new
            {
                message = $"Nie można usunąć grupy '{grupa.NazwaGrupy}', ponieważ ma przypisane rezerwacje.",
                canDelete = false,
                reservationCount = grupa.Rezerwacjas.Count
            });
        }

        // Odłącz klientów od grupy (ustaw IdGrupa na NULL)
        foreach (var klient in grupa.Klients)
        {
            klient.IdGrupa = null;
        }

        try
        {
            _context.Grupas.Remove(grupa);
            await _context.SaveChangesAsync();
            return NoContent();
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Błąd podczas usuwania grupy {Id}", id);
            return StatusCode(500, new { message = "Wystąpił błąd podczas usuwania grupy." });
        }
    }

    // POST: api/grupy/5/klienci
    [HttpPost("{id:int}/klienci")]
    public async Task<IActionResult> AddKlienciToGrupa(int id, [FromBody] List<int> klientIds)
    {
        var grupa = await _context.Grupas.FindAsync((uint)id);
        
        if (grupa == null)
            return NotFound(new { message = "Nie znaleziono grupy." });

        var klienci = await _context.Klients
            .Where(k => klientIds.Contains((int)k.IdKlient))
            .ToListAsync();

        foreach (var klient in klienci)
        {
            klient.IdGrupa = (uint)id;
        }

        await _context.SaveChangesAsync();

        return Ok(new { message = $"Dodano {klienci.Count} klientów do grupy." });
    }
    [HttpPost("{grupaId:int}/klienci/{klientId:int}")]
    public async Task<IActionResult> AddKlientToGrupa(int grupaId, int klientId)
    {
        var grupa = await _context.Grupas.FindAsync((uint)grupaId);
    
        if (grupa == null)
            return NotFound(new { message = "Nie znaleziono grupy." });

        var klient = await _context.Klients.FindAsync((uint)klientId);
    
        if (klient == null)
            return NotFound(new { message = "Nie znaleziono klienta." });

        if (klient.IdGrupa == grupaId)
            return BadRequest(new { message = "Klient już jest w tej grupie." });

        klient.IdGrupa = (uint)grupaId;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Klient dodany do grupy." });
    }
    // DELETE: api/grupy/5/klienci/10
    [HttpDelete("{grupaId:int}/klienci/{klientId:int}")]
    public async Task<IActionResult> RemoveKlientFromGrupa(int grupaId, int klientId)
    {
        var klient = await _context.Klients.FindAsync((uint)klientId);

        if (klient == null || klient.IdGrupa != grupaId)
            return NotFound(new { message = "Nie znaleziono klienta w tej grupie." });

        klient.IdGrupa = null;
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
