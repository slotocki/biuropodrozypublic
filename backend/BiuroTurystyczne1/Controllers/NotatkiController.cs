using BiuroTurystyczne1.Data.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Microsoft.AspNetCore.Identity;

namespace BiuroTurystyczne1.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotatkiController : ControllerBase
{
    private readonly BiuroDbContext _context;
    private readonly UserManager<IdentityUser> _userManager;
    private readonly ILogger<NotatkiController> _logger;

    public NotatkiController(
        BiuroDbContext context,
        UserManager<IdentityUser> userManager,
        ILogger<NotatkiController> logger)
    {
        _context = context;
        _userManager = userManager;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetNotatki()
    {
        try
        {
            var now = DateTime.Now;
            var notatki = await _context.Notatkis
                .Where(n => n.DataPojawienia <= now && (n.DataZnikniecia == null || now < n.DataZnikniecia))
                .OrderByDescending(n => n.DataPojawienia)
                .ToListAsync();

       
            var notatkiDto = new List<object>();
            foreach (var n in notatki)
            {
                var autor = "Nieznany";
                if (!string.IsNullOrEmpty(n.IdUzytkownik))
                {
                    var user = await _userManager.FindByIdAsync(n.IdUzytkownik);
                    autor = user?.UserName ?? "Nieznany";
                }

                notatkiDto.Add(new
                {
                    n.IdNotatki,
                    n.Tytul,
                    n.Tresc,
                    n.DataPojawienia,
                    n.DataZnikniecia,
                    n.IdUzytkownik,
                    Autor = autor
                });
            }

            return Ok(notatkiDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Błąd podczas pobierania notatek");
            return StatusCode(500, new { message = "Błąd podczas pobierania notatek." });
        }
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetNotatka(int id)
    {
        var notatka = await _context.Notatkis
            .FirstOrDefaultAsync(n => n.IdNotatki == id);

        if (notatka == null)
        {
            return NotFound(new { message = "Nie znaleziono notatki." });
        }

      
        var autor = "Nieznany";
        if (!string.IsNullOrEmpty(notatka.IdUzytkownik))
        {
            var user = await _userManager.FindByIdAsync(notatka.IdUzytkownik);
            autor = user?.UserName ?? "Nieznany";
        }

        return Ok(new
        {
            notatka.IdNotatki,
            notatka.Tytul,
            notatka.Tresc,
            notatka.DataPojawienia,
            notatka.DataZnikniecia,
            notatka.IdUzytkownik,
            Autor = autor
        });
    }

    [HttpPost]
    public async Task<IActionResult> CreateNotatka([FromBody] CreateNotatkaDto notatkaDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            
            var identityUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(identityUserId))
            {
                return Unauthorized(new { message = "Użytkownik nie jest zalogowany" });
            }

            var identityUser = await _userManager.FindByIdAsync(identityUserId);
            if (identityUser == null)
            {
                return Unauthorized(new { message = "Nie znaleziono użytkownika" });
            }

            var notatka = new Notatki
            {
                Tytul = notatkaDto.Tytul,
                Tresc = notatkaDto.Tresc,
                IdUzytkownik = identityUserId, 
                DataPojawienia = notatkaDto.DataPojawienia ?? DateTime.Now,
                DataZnikniecia = notatkaDto.DataZnikniecia
            };

            await _context.Notatkis.AddAsync(notatka);
            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetNotatka),
                new { id = notatka.IdNotatki },
                new
                {
                    notatka.IdNotatki,
                    notatka.Tytul,
                    notatka.Tresc,
                    notatka.DataPojawienia,
                    notatka.DataZnikniecia,
                    notatka.IdUzytkownik,
                    Autor = identityUser.UserName
                });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Błąd podczas tworzenia notatki");
            return StatusCode(500, new { message = "Błąd podczas tworzenia notatki.", details = ex.Message });
        }
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateNotatka(int id, [FromBody] UpdateNotatkaDto notatkaDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var notatka = await _context.Notatkis.FindAsync((uint)id);

            if (notatka == null)
            {
                return NotFound(new { message = "Nie znaleziono notatki." });
            }

            notatka.Tytul = notatkaDto.Tytul;
            notatka.Tresc = notatkaDto.Tresc;
            notatka.DataPojawienia = notatkaDto.DataPojawienia ?? notatka.DataPojawienia;
            notatka.DataZnikniecia = notatkaDto.DataZnikniecia;

            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!await _context.Notatkis.AnyAsync(n => n.IdNotatki == id))
            {
                return NotFound();
            }
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Błąd podczas aktualizacji notatki {Id}", id);
            return StatusCode(500, new { message = "Błąd podczas aktualizacji notatki." });
        }
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteNotatka(int id)
    {
        try
        {
            var notatka = await _context.Notatkis.FindAsync((uint)id);

            if (notatka == null)
            {
                return NotFound(new { message = "Nie znaleziono notatki." });
            }

            _context.Notatkis.Remove(notatka);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Błąd podczas usuwania notatki {Id}", id);
            return StatusCode(500, new { message = "Błąd podczas usuwania notatki." });
        }
    }
}

// DTOs
public class CreateNotatkaDto
{
    public string Tytul { get; set; } = string.Empty;
    public string? Tresc { get; set; }
    public DateTime? DataPojawienia { get; set; }
    public DateTime? DataZnikniecia { get; set; }
}

public class UpdateNotatkaDto
{
    public string Tytul { get; set; } = string.Empty;
    public string? Tresc { get; set; }
    public DateTime? DataPojawienia { get; set; }
    public DateTime? DataZnikniecia { get; set; }
}
