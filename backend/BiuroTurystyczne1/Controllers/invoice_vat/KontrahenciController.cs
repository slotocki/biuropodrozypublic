using BiuroTurystyczne1.Data.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Net.Http.Headers;
using System.Text.Json;

namespace BiuroTurystyczne1.Controllers.invoice_vat;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class KontrahenciController : ControllerBase
{
    private readonly BiuroDbContext _context;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<KontrahenciController> _logger;

    public KontrahenciController(
        BiuroDbContext context, 
        IHttpClientFactory httpClientFactory, 
        IConfiguration configuration,
        ILogger<KontrahenciController> logger)
    {
        _context = context;
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _logger = logger;
    }

    [HttpGet("ceidg/{nip}")]
    public async Task<IActionResult> GetDaneZCeidg(string nip)
    {
        var apiKey = _configuration["ApiKeys:CEIDG"];
        if (string.IsNullOrEmpty(apiKey))
        {
            return StatusCode(500, new { message = "Klucz API do CEIDG nie jest skonfigurowany." });
        }

        var client = _httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

        try
        {
            var url = $"https://dane.biznes.gov.pl/api/ceidg/v3/firma?nip={nip}";
            _logger.LogInformation("Wysyłam zapytanie do CEIDG: {Url}", url);
            
            var response = await client.GetAsync(url);
            
            if (response.StatusCode == System.Net.HttpStatusCode.NoContent)
            {
                return NotFound(new { message = "Nie znaleziono firmy o podanym numerze NIP." });
            }
            
            var content = await response.Content.ReadAsStringAsync();
            
            if (!response.IsSuccessStatusCode)
            {
                return StatusCode((int)response.StatusCode, new { 
                    message = "Błąd podczas komunikacji z API CEIDG.", 
                    details = content
                });
            }
            
            if (string.IsNullOrWhiteSpace(content))
            {
                return NotFound(new { message = "API CEIDG zwróciło pustą odpowiedź." });
            }
            
            // Parsuj JSON z CEIDG
            try
            {
                var ceidgData = JsonDocument.Parse(content);
                var root = ceidgData.RootElement;
                
                if (!root.TryGetProperty("firma", out var firmaArray) || firmaArray.ValueKind != JsonValueKind.Array)
                {
                    return NotFound(new { message = "Nie znaleziono firmy o podanym numerze NIP." });
                }
                
                if (firmaArray.GetArrayLength() == 0)
                {
                    return NotFound(new { message = "Nie znaleziono firmy o podanym numerze NIP." });
                }
                
                var firma = firmaArray[0];
                
                // ✅ Wyciągnij dane właściciela
                string nipWlasciciela = "";
                string regon = "";
                if (firma.TryGetProperty("wlasciciel", out var wlasciciel))
                {
                    nipWlasciciela = wlasciciel.TryGetProperty("nip", out var nipProp) ? nipProp.GetString() ?? "" : "";
                    regon = wlasciciel.TryGetProperty("regon", out var regonProp) ? regonProp.GetString() ?? "" : "";
                }
                
                // ✅ Wyciągnij adres działalności
                string ulica = "";
                string budynek = "";
                string lokal = "";
                string miasto = "";
                string kod = "";
                
                if (firma.TryGetProperty("adresDzialalnosci", out var adres))
                {
                    ulica = adres.TryGetProperty("ulica", out var ulicaProp) ? ulicaProp.GetString() ?? "" : "";
                    budynek = adres.TryGetProperty("budynek", out var budynekProp) ? budynekProp.GetString() ?? "" : "";
                    lokal = adres.TryGetProperty("lokal", out var lokalProp) ? lokalProp.GetString() ?? "" : "";
                    miasto = adres.TryGetProperty("miasto", out var miastoProp) ? miastoProp.GetString() ?? "" : "";
                    kod = adres.TryGetProperty("kod", out var kodProp) ? kodProp.GetString() ?? "" : "";
                }
                
                // Połącz ulicę z numerem budynku i lokalem
                var ulicaPelna = ulica;
                if (!string.IsNullOrEmpty(budynek))
                {
                    ulicaPelna += $" {budynek}";
                }
                if (!string.IsNullOrEmpty(lokal))
                {
                    ulicaPelna += $"/{lokal}";
                }
                
                var result = new
                {
                    nip = nipWlasciciela,
                    nazwa = firma.TryGetProperty("nazwa", out var nazwaProp) ? nazwaProp.GetString() : "",
                    regon = regon,
                    miejscowosc = miasto,
                    ulica = ulicaPelna.Trim(),
                    kodPocztowy = kod,
                    email = "", // CEIDG v3 nie zwraca emaila w tym endpoincie
                    telefon = "", // CEIDG v3 nie zwraca telefonu w tym endpoincie
                    status = firma.TryGetProperty("status", out var statusProp) ? statusProp.GetString() : ""
                };
                
                _logger.LogInformation("Pomyślnie przetworzono dane dla NIP: {Nip}", nip);
                return Ok(result);
            }
            catch (JsonException jsonEx)
            {
                _logger.LogError(jsonEx, "Błąd parsowania JSON z CEIDG.");
                return StatusCode(500, new { 
                    message = "Błąd przetwarzania danych z CEIDG.", 
                    details = jsonEx.Message 
                });
            }
        }
        catch (HttpRequestException httpEx)
        {
            _logger.LogError(httpEx, "Błąd połączenia z API CEIDG dla NIP: {Nip}", nip);
            return StatusCode(500, new { message = $"Błąd połączenia z API CEIDG: {httpEx.Message}" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Nieoczekiwany błąd dla NIP: {Nip}", nip);
            return StatusCode(500, new { message = $"Wystąpił wewnętrzny błąd: {ex.Message}" });
        }
    }

    [HttpGet]
    public async Task<IActionResult> GetKontrahenci()
    {
        return Ok(await _context.Kontrahents.ToListAsync());
    }

    [HttpPost]
    public async Task<IActionResult> CreateKontrahent(Kontrahent kontrahent)
    {
        _context.Kontrahents.Add(kontrahent);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetKontrahent), new { id = (int)kontrahent.IdKontrahent }, kontrahent);
    }
    
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetKontrahent(int id)
    {
        var kontrahent = await _context.Kontrahents.FindAsync((uint)id);
        return kontrahent == null ? NotFound() : Ok(kontrahent);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateKontrahent(int id, Kontrahent kontrahent)
    {
        if (id != kontrahent.IdKontrahent)
        {
            return BadRequest(new { message = "ID w URL nie zgadza się z ID w obiekcie." });
        }
        
        _context.Entry(kontrahent).State = EntityState.Modified;
        
        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!await _context.Kontrahents.AnyAsync(k => k.IdKontrahent == id))
            {
                return NotFound();
            }
            throw;
        }
        
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteKontrahent(int id)
    {
        var kontrahent = await _context.Kontrahents.FindAsync((uint)id);
        if (kontrahent == null)
        {
            return NotFound(new { message = "Nie znaleziono kontrahenta." });
        }
    
        // ✅ SPRAWDŹ czy kontrahent ma faktury
        var maFaktury = await _context.FakturaVats
            .AnyAsync(f => f.IdKontrahent == id);
    
        if (maFaktury)
        {
            var liczbaFaktur = await _context.FakturaVats
                .CountAsync(f => f.IdKontrahent == id);
        
            return BadRequest(new { 
                message = $"Nie można usunąć kontrahenta '{kontrahent.NazwaFirmy}', ponieważ ma przypisane {liczbaFaktur} faktur(y).",
                canDelete = false,
                invoiceCount = liczbaFaktur
            });
        }
    
        try
        {
            _context.Kontrahents.Remove(kontrahent);
            await _context.SaveChangesAsync();
            return NoContent();
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Błąd podczas usuwania kontrahenta {Id}", id);
            return StatusCode(500, new { message = "Wystąpił błąd podczas usuwania kontrahenta." });
        }
    }
}
