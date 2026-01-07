using BiuroTurystyczne1.Data.Models;
using BiuroTurystyczne1.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BiuroTurystyczne1.DTOs;

namespace BiuroTurystyczne1.Controllers.customer;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class KlienciController : ControllerBase
{
    private readonly BiuroDbContext _context;
    private readonly IAddressValidationService _addressValidation;
    private readonly ILogger<KlienciController> _logger;

    public KlienciController(
        BiuroDbContext context,
        IAddressValidationService addressValidation,
        ILogger<KlienciController> logger)
    {
        _context = context;
        _addressValidation = addressValidation;
        _logger = logger;
    }

    // GET: api/klienci
    [HttpGet]
    public async Task<IActionResult> GetKlienci()
    {
        var klienci = await _context.Klients
            .Include(k => k.IdGrupaNavigation)
            .Include(k => k.IdObywatelstwoNavigation)
            .Select(k => new
            {
                k.IdKlient,
                k.Imie,
                k.Nazwisko,
                k.Ulica,
                k.KodPocztowy,
                k.Miejscowosc,
                k.Email,
                k.Telefon,
                k.DataUrodzenia,
                k.Adnotacje,
                k.IdGrupa,
                NazwaGrupy = k.IdGrupaNavigation != null ? k.IdGrupaNavigation.NazwaGrupy : null,
                Obywatelstwo = k.IdObywatelstwoNavigation != null ? k.IdObywatelstwoNavigation.Obywatelstwo1 : null,
                IloscWystapien = k.UczestnikRezerwacjis.Count
            })
            .ToListAsync();

        return Ok(klienci);
    }

    // GET: api/klienci/5
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetKlient(int id)
    {
        var klient = await _context.Klients
            .Include(k => k.IdGrupaNavigation)
            .Include(k => k.IdObywatelstwoNavigation)
            .FirstOrDefaultAsync(k => k.IdKlient == id);

        if (klient == null)
            return NotFound(new { message = "Nie znaleziono klienta." });

        return Ok(klient);
    }

    // POST: api/klienci
    [HttpPost]
    public async Task<IActionResult> CreateKlient([FromBody] Klient klient)
    {
        // Walidacja wymaganych pól
        if (string.IsNullOrWhiteSpace(klient.Imie))
            return BadRequest(new { message = "Imię jest wymagane." });

        if (string.IsNullOrWhiteSpace(klient.Nazwisko))
            return BadRequest(new { message = "Nazwisko jest wymagane." });

        // Walidacja unikalności email (jeśli podany)
        if (!string.IsNullOrWhiteSpace(klient.Email))
        {
            var existingEmail = await _context.Klients
                .AnyAsync(k => k.Email == klient.Email);
            
            if (existingEmail)
                return BadRequest(new { message = "Klient z tym adresem email już istnieje." });
        }

        try
        {
            _context.Klients.Add(klient);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetKlient), new { id = klient.IdKlient }, klient);
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Błąd podczas dodawania klienta");
            return StatusCode(500, new { message = "Wystąpił błąd podczas dodawania klienta." });
        }
    }

    // PUT: api/klienci/5
    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateKlient(int id, [FromBody] Klient klient)
    {
        if (id != klient.IdKlient)
            return BadRequest(new { message = "ID w URL nie zgadza się z ID w obiekcie." });

        // Walidacja wymaganych pól
        if (string.IsNullOrWhiteSpace(klient.Imie))
            return BadRequest(new { message = "Imię jest wymagane." });

        if (string.IsNullOrWhiteSpace(klient.Nazwisko))
            return BadRequest(new { message = "Nazwisko jest wymagane." });

        // Walidacja unikalności email (wykluczając edytowany rekord)
        if (!string.IsNullOrWhiteSpace(klient.Email))
        {
            var existingEmail = await _context.Klients
                .AnyAsync(k => k.Email == klient.Email && k.IdKlient != id);
            
            if (existingEmail)
                return BadRequest(new { message = "Inny klient z tym adresem email już istnieje." });
        }

        _context.Entry(klient).State = EntityState.Modified;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!await _context.Klients.AnyAsync(k => k.IdKlient == id))
                return NotFound(new { message = "Nie znaleziono klienta." });
            throw;
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Błąd podczas aktualizacji klienta {Id}", id);
            return StatusCode(500, new { message = "Wystąpił błąd podczas aktualizacji klienta." });
        }

        return NoContent();
    }

    // DELETE: api/klienci/5
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteKlient(int id)
    {
        var klient = await _context.Klients.FindAsync((uint)id);
        
        if (klient == null)
            return NotFound(new { message = "Nie znaleziono klienta." });

        //  czy klient ma rezerwacje
        var maRezerwacje = await _context.UczestnikRezerwacjis
            .AnyAsync(u => u.IdKlient == id);

        if (maRezerwacje)
        {
            var liczbaRezerwacji = await _context.UczestnikRezerwacjis
                .CountAsync(u => u.IdKlient == id);

            return BadRequest(new
            {
                message = $"Nie można usunąć klienta '{klient.Imie} {klient.Nazwisko}', ponieważ ma {liczbaRezerwacji} rezerwację/rezerwacji.",
                canDelete = false,
                reservationCount = liczbaRezerwacji
            });
        }

        try
        {
            _context.Klients.Remove(klient);
            await _context.SaveChangesAsync();
            return NoContent();
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Błąd podczas usuwania klienta {Id}", id);
            return StatusCode(500, new { message = "Wystąpił błąd podczas usuwania klienta." });
        }
    }

    // POST: api/klienci/lookup-postal-code
    [HttpPost("lookup-postal-code")]
    public async Task<IActionResult> LookupPostalCode([FromBody] PostalCodeRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.KodPocztowy))
            return BadRequest(new { message = "Kod pocztowy jest wymagany." });

        var result = await _addressValidation.GetLocationByPostalCodeAsync(request.KodPocztowy);
        return Ok(result);
    }

    // GET: api/klienci/obywatelstwa
    [HttpGet("obywatelstwa")]
    public async Task<IActionResult> GetObywatelstwa()
    {
        try
        {
            var obywatelstwa = await _context.Obywatelstwos
                .OrderBy(o => o.Obywatelstwo1)
                .Select(o => new
                {
                    idObywatelstwo = o.IdObywatelstwo,
                    nazwa = o.Obywatelstwo1
                })
                .ToListAsync();

            return Ok(obywatelstwa);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Błąd podczas pobierania listy obywatelstw");
            return StatusCode(500, new { message = "Wystąpił błąd podczas pobierania listy obywatelstw." });
        }
    }
    // POST: api/klienci/import
    [HttpPost("import")]
    public async Task<IActionResult> ImportKlienci(
        [FromBody] ImportKlientiDto dto,
        [FromServices] IKlienciImportService importService)
    {
        if (dto?.Clients == null || dto.Clients.Count == 0)
            return BadRequest(new { message = "Brak klientów do importu" });

        try
        {
            var result = await importService.ImportKlienciAsync(dto);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Błąd podczas importu klientów");
            return StatusCode(500, new { message = "Błąd podczas importu: " + ex.Message });
        }
    }

    // GET: api/klienci/search?query=Jan
    [HttpGet("search")]
    public async Task<IActionResult> SearchKlienci([FromQuery] string query)
    {
        if (string.IsNullOrWhiteSpace(query) || query.Length < 2)
            return BadRequest(new { message = "Zapytanie musi mieć przynajmniej 2 znaki." });

        try
        {
            var klienci = await _context.Klients
                .Where(k => k.Imie.Contains(query) || k.Nazwisko.Contains(query))
                .Select(k => new
                {
                    k.IdKlient,
                    k.Imie,
                    k.Nazwisko,
                    k.Email,
                    k.Telefon,
                    DisplayName = k.Imie + " " + k.Nazwisko + (string.IsNullOrEmpty(k.Email) ? "" : " (" + k.Email + ")")
                })
                .Take(20)
                .ToListAsync();

            return Ok(klienci);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Błąd podczas wyszukiwania klientów dla zapytania: {Query}", query);
            return StatusCode(500, new { message = "Wystąpił błąd podczas wyszukiwania klientów." });
        }
    }
}

public class PostalCodeRequest
{
    public string KodPocztowy { get; set; } = "";
}
