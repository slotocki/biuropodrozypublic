using BiuroTurystyczne1.Data.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using BiuroTurystyczne1.Infrastructure.Documents;
using QuestPDF.Fluent;

namespace BiuroTurystyczne1.Controllers.invoice_vat;

[ApiController]
[Route("api/fakturyvat")]
[Authorize]
public class FakturyVatController : ControllerBase
{
    private readonly BiuroDbContext _context;
    private readonly UserManager<IdentityUser> _userManager;
    private readonly IConfiguration _configuration;

    public FakturyVatController(
        BiuroDbContext context, 
        UserManager<IdentityUser> userManager,
        IConfiguration configuration)
    {
        _context = context;
        _userManager = userManager;
        _configuration = configuration;
    }
    
    private string GetGeneratedFolderPath()
    {
        var generatedPath = _configuration["FileStorage:GeneratedPath"] ?? "Generated/Invoices";
        return Path.Combine(Directory.GetCurrentDirectory(), generatedPath);
    }
    
    [HttpGet]
    public async Task<IActionResult> GetFaktury()
    {
        var faktury = await _context.FakturaVats
            .Include(f => f.IdKontrahentNavigation)
            .Select(f => new 
            {
                f.IdFaktura,
                f.NumerFaktury,
                f.DataWystawienia,
                f.KwotaBrutto,
                NazwaKontrahenta = f.IdKontrahentNavigation.NazwaFirmy
            })
            .OrderByDescending(f => f.DataWystawienia)
            .ToListAsync();
            
        return Ok(faktury);
    }

    [HttpGet("next-number")]
    public async Task<IActionResult> GetNextInvoiceNumber()
    {
        var today = DateTime.Now;
        var month = today.Month.ToString().PadLeft(2, '0');
        var year = today.Year;
        
        var fakturyMiesiaca = await _context.FakturaVats
            .Where(f => f.NumerFaktury.Contains($"/{month}/{year}"))
            .Select(f => f.NumerFaktury)
            .ToListAsync();
        
        int maxNumer = 0;
        foreach (var numer in fakturyMiesiaca)
        {
            var parts = numer.Split('/');
            if (parts.Length > 0 && int.TryParse(parts[0], out int num))
            {
                if (num > maxNumer)
                    maxNumer = num;
            }
        }
        
        var nextNumber = $"{maxNumer + 1}/{month}/{year}";
        return Ok(new { numerFaktury = nextNumber });
    }

    [HttpPost]
    public async Task<IActionResult> CreateFaktura([FromBody] CreateFakturaVatDto fakturaDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        await using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // ⭐ Sprawdzenie NULL
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

            var numerFaktury = fakturaDto.NumerFaktury;
            var istniejeFaktura = await _context.FakturaVats
                .AnyAsync(f => f.NumerFaktury == numerFaktury);
            
            if (istniejeFaktura)
            {
                var today = DateTime.Now;
                var month = today.Month.ToString().PadLeft(2, '0');
                var year = today.Year;
                
                var fakturyMiesiaca = await _context.FakturaVats
                    .Where(f => f.NumerFaktury.Contains($"/{month}/{year}"))
                    .Select(f => f.NumerFaktury)
                    .ToListAsync();
                
                int maxNumer = 0;
                foreach (var numer in fakturyMiesiaca)
                {
                    var parts = numer.Split('/');
                    if (parts.Length > 0 && int.TryParse(parts[0], out int num))
                    {
                        if (num > maxNumer)
                            maxNumer = num;
                    }
                }
                
                numerFaktury = $"{maxNumer + 1}/{month}/{year}";
            }

            var faktura = new FakturaVat
            {
                IdKontrahent = fakturaDto.IdKontrahent,
                NumerFaktury = numerFaktury,
                DataWystawienia = fakturaDto.DataWystawienia,
                TerminPlatnosci = fakturaDto.TerminPlatnosci,
                FormaPlatnosci = fakturaDto.FormaPlatnosci,
                Zaplacono = fakturaDto.Zaplacono,
                IdUser = identityUserId,
                KwotaNetto = fakturaDto.Pozycje.Sum(p => p.CenaNetto * p.Ilosc),
                KwotaBrutto = fakturaDto.Pozycje.Sum(p => Math.Round(p.CenaNetto * p.Ilosc * (1 + p.StawkaVat / 100), 2)),
                KwotaVat = 0
            };
            faktura.KwotaVat = faktura.KwotaBrutto - faktura.KwotaNetto;

            await _context.FakturaVats.AddAsync(faktura);
            await _context.SaveChangesAsync();

            foreach (var pozycjaDto in fakturaDto.Pozycje)
            {
                var pozycja = new FakturaVatPozycja
                {
                    IdFaktura = faktura.IdFaktura,
                    IdUsluga = pozycjaDto.IdUsluga,
                    Ilosc = pozycjaDto.Ilosc,
                    CenaNetto = pozycjaDto.CenaNetto,
                    StawkaVat = pozycjaDto.StawkaVat
                };
                await _context.FakturaVatPozycjas.AddAsync(pozycja);
            }

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
            
            // ========== GENEROWANIE PDF ==========
            try
            {
                var fakturaDoPdf = await _context.FakturaVats
                    .Include(f => f.IdKontrahentNavigation)
                    .Include(f => f.FakturaVatPozycjas)
                        .ThenInclude(p => p.IdUslugaNavigation)
                    .FirstOrDefaultAsync(f => f.IdFaktura == faktura.IdFaktura);
                
                if (fakturaDoPdf != null && !string.IsNullOrEmpty(fakturaDoPdf.IdUser))
                {
                    // ⭐ Sprawdzenie NULL
                    var wystawiajacyUser = await _userManager.FindByIdAsync(fakturaDoPdf.IdUser);
                    var wystawiajacyNazwa = wystawiajacyUser?.UserName ?? "Brak danych";
                    
                    var pdfFolderPath = GetGeneratedFolderPath();
                    var year = fakturaDoPdf.DataWystawienia.Year;
                    var month = fakturaDoPdf.DataWystawienia.Month.ToString("D2");
                    var organizedPath = Path.Combine(pdfFolderPath, year.ToString(), month);
                    
                    if (!Directory.Exists(organizedPath))
                    {
                        Directory.CreateDirectory(organizedPath);
                    }
                    
                    var wystawiajacyTemp = new Uzytkownik { Login = wystawiajacyNazwa };
                    var document = new FakturaVatDocument(fakturaDoPdf, wystawiajacyTemp);
                    var pdfBytes = document.GeneratePdf();
                    
                    var fileName = $"faktura-{fakturaDoPdf.NumerFaktury.Replace('/', '_')}.pdf";
                    var filePath = Path.Combine(organizedPath, fileName);
                    await System.IO.File.WriteAllBytesAsync(filePath, pdfBytes);
                    
                    var relativePath = _configuration["FileStorage:GeneratedPath"] ?? "Generated/Invoices";
                    fakturaDoPdf.SciezkaPdf = Path.Combine(relativePath, year.ToString(), month, fileName);
                    await _context.SaveChangesAsync();
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Błąd podczas generowania PDF: {ex.Message}");
            }
            
            return Ok(new 
            { 
                success = true,
                idFaktura = faktura.IdFaktura,
                numerFaktury = faktura.NumerFaktury,
                kwotaBrutto = faktura.KwotaBrutto,
                message = "Faktura została pomyślnie utworzona"
            });
        }
        catch (DbUpdateException ex)
        {
            await transaction.RollbackAsync();
            
            var innerMessage = ex.InnerException?.Message ?? ex.Message;
            
            if (innerMessage.Contains("Duplicate entry") && innerMessage.Contains("uq_faktura_vat__numer"))
            {
                return Conflict(new 
                { 
                    message = "Numer faktury już istnieje. Spróbuj ponownie - system wygeneruje nowy.",
                    details = innerMessage 
                });
            }
            
            return StatusCode(500, new { message = "Błąd zapisu do bazy", details = innerMessage });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, new { message = $"Wewnętrzny błąd serwera: {ex.Message}" });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteFaktura(uint id)
    {
        var faktura = await _context.FakturaVats.FindAsync(id);
        if (faktura == null) return NotFound();

        if (!string.IsNullOrEmpty(faktura.SciezkaPdf))
        {
            try
            {
                var filePath = Path.Combine(Directory.GetCurrentDirectory(), faktura.SciezkaPdf);
                if (System.IO.File.Exists(filePath))
                {
                    System.IO.File.Delete(filePath);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Błąd podczas usuwania pliku PDF: {ex.Message}");
            }
        }

        var pozycje = await _context.FakturaVatPozycjas.Where(p => p.IdFaktura == id).ToListAsync();
        if(pozycje.Any())
            _context.FakturaVatPozycjas.RemoveRange(pozycje);
        
        _context.FakturaVats.Remove(faktura);
        await _context.SaveChangesAsync();

        return NoContent();
    }
    [HttpGet("{id}")]
    public async Task<IActionResult> GetFaktura(uint id)
    {
        var faktura = await _context.FakturaVats
            .Include(f => f.IdKontrahentNavigation)
            .FirstOrDefaultAsync(f => f.IdFaktura == id);
        
        if (faktura == null)
        {
            return NotFound(new { message = "Nie znaleziono faktury" });
        }
    
        return Ok(new
        {
            IdFaktura = faktura.IdFaktura,
            IdKontrahent = faktura.IdKontrahent, // ⭐ TO JEST POTRZEBNE
            NumerFaktury = faktura.NumerFaktury,
            DataWystawienia = faktura.DataWystawienia,
            KwotaBrutto = faktura.KwotaBrutto
        });
    }

    [HttpGet("{id}/edit")]
    public async Task<IActionResult> GetFakturaToEdit(uint id)
    {
        try
        {
            var faktura = await _context.FakturaVats
                .Include(f => f.IdKontrahentNavigation)
                .Include(f => f.FakturaVatPozycjas)
                    .ThenInclude(p => p.IdUslugaNavigation)
                .FirstOrDefaultAsync(f => f.IdFaktura == id);
                
            if (faktura == null)
            {
                return NotFound(new { message = "Nie znaleziono faktury" });
            }
            
            return Ok(new
            {
                faktura.IdFaktura,
                faktura.IdKontrahent,
                faktura.NumerFaktury,
                DataWystawienia = faktura.DataWystawienia.ToString("yyyy-MM-dd"),
                TerminPlatnosci = faktura.TerminPlatnosci?.ToString("yyyy-MM-dd"),
                faktura.FormaPlatnosci,
                faktura.Zaplacono,
                Kontrahent = new
                {
                    faktura.IdKontrahentNavigation.IdKontrahent,
                    faktura.IdKontrahentNavigation.NazwaFirmy,
                    faktura.IdKontrahentNavigation.Nip,
                    faktura.IdKontrahentNavigation.Ulica,
                    faktura.IdKontrahentNavigation.KodPocztowy,
                    faktura.IdKontrahentNavigation.Miejscowosc
                },
                Pozycje = faktura.FakturaVatPozycjas.Select(p => new
                {
                    p.IdUsluga,
                    p.IdUslugaNavigation.NazwaUslugi,
                    p.Ilosc,
                    p.CenaNetto,
                    p.StawkaVat
                }).ToList()
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Błąd podczas pobierania faktury: {ex.Message}");
            return StatusCode(500, new { message = "Błąd serwera podczas pobierania faktury" });
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateFaktura(uint id, [FromBody] CreateFakturaVatDto fakturaDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        await using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var stараFaktura = await _context.FakturaVats
                .Include(f => f.FakturaVatPozycjas)
                .FirstOrDefaultAsync(f => f.IdFaktura == id);
                
            if (stараFaktura == null)
            {
                return NotFound(new { message = "Nie znaleziono faktury do edycji" });
            }
            
            stараFaktura.CzyAnulowana = true;
            await _context.SaveChangesAsync();
            
            var oryginalnaFakturaId = stараFaktura.OryginalnaFakturaId ?? stараFaktura.IdFaktura;
            
            var maksymalnaWersja = await _context.FakturaVats
                .Where(f => f.OryginalnaFakturaId == oryginalnaFakturaId || f.IdFaktura == oryginalnaFakturaId)
                .MaxAsync(f => (int?)f.Wersja) ?? 1;
            
            var nowaWersja = maksymalnaWersja + 1;
            var numerBazowy = stараFaktura.NumerFaktury.Split('_')[0];
            var nowyNumerFaktury = $"{numerBazowy}_{nowaWersja}";
            
            // ⭐ Sprawdzenie NULL
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
            
            var nowaFaktura = new FakturaVat
            {
                IdKontrahent = fakturaDto.IdKontrahent,
                NumerFaktury = nowyNumerFaktury,
                DataWystawienia = fakturaDto.DataWystawienia,
                TerminPlatnosci = fakturaDto.TerminPlatnosci,
                FormaPlatnosci = fakturaDto.FormaPlatnosci,
                Zaplacono = fakturaDto.Zaplacono,
                IdUser = identityUserId,
                OryginalnaFakturaId = oryginalnaFakturaId,
                Wersja = nowaWersja,
                CzyAnulowana = false,
                KwotaNetto = fakturaDto.Pozycje.Sum(p => p.CenaNetto * p.Ilosc),
                KwotaBrutto = fakturaDto.Pozycje.Sum(p => Math.Round(p.CenaNetto * p.Ilosc * (1 + p.StawkaVat / 100), 2)),
                KwotaVat = 0
            };
            nowaFaktura.KwotaVat = nowaFaktura.KwotaBrutto - nowaFaktura.KwotaNetto;

            await _context.FakturaVats.AddAsync(nowaFaktura);
            await _context.SaveChangesAsync();

            foreach (var pozycjaDto in fakturaDto.Pozycje)
            {
                var pozycja = new FakturaVatPozycja
                {
                    IdFaktura = nowaFaktura.IdFaktura,
                    IdUsluga = pozycjaDto.IdUsluga,
                    Ilosc = pozycjaDto.Ilosc,
                    CenaNetto = pozycjaDto.CenaNetto,
                    StawkaVat = pozycjaDto.StawkaVat
                };
                await _context.FakturaVatPozycjas.AddAsync(pozycja);
            }
            await _context.SaveChangesAsync();
            
            // ========== GENEROWANIE PDF ==========
            try
            {
                var fakturaDoPdf = await _context.FakturaVats
                    .Include(f => f.IdKontrahentNavigation)
                    .Include(f => f.FakturaVatPozycjas)
                        .ThenInclude(p => p.IdUslugaNavigation)
                    .FirstOrDefaultAsync(f => f.IdFaktura == nowaFaktura.IdFaktura);
                
                if (fakturaDoPdf != null && !string.IsNullOrEmpty(fakturaDoPdf.IdUser))
                {
                    // ⭐ Sprawdzenie NULL
                    var wystawiajacyUser = await _userManager.FindByIdAsync(fakturaDoPdf.IdUser);
                    var wystawiajacyNazwa = wystawiajacyUser?.UserName ?? "Brak danych";
                    
                    var pdfFolderPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "Generated", "Invoices");
                    var year = fakturaDoPdf.DataWystawienia.Year;
                    var month = fakturaDoPdf.DataWystawienia.Month.ToString("D2");
                    var organizedPath = Path.Combine(pdfFolderPath, year.ToString(), month);
                    
                    if (!Directory.Exists(organizedPath))
                    {
                        Directory.CreateDirectory(organizedPath);
                    }
                    
                    var dokumentZOryginalnymNumerem = new FakturaVat
                    {
                        IdFaktura = fakturaDoPdf.IdFaktura,
                        NumerFaktury = numerBazowy,
                        DataWystawienia = fakturaDoPdf.DataWystawienia,
                        TerminPlatnosci = fakturaDoPdf.TerminPlatnosci,
                        FormaPlatnosci = fakturaDoPdf.FormaPlatnosci,
                        Zaplacono = fakturaDoPdf.Zaplacono,
                        KwotaNetto = fakturaDoPdf.KwotaNetto,
                        KwotaBrutto = fakturaDoPdf.KwotaBrutto,
                        KwotaVat = fakturaDoPdf.KwotaVat,
                        IdKontrahentNavigation = fakturaDoPdf.IdKontrahentNavigation,
                        FakturaVatPozycjas = fakturaDoPdf.FakturaVatPozycjas
                    };
                    
                    var wystawiajacyTemp = new Uzytkownik { Login = wystawiajacyNazwa };
                    var document = new FakturaVatDocument(dokumentZOryginalnymNumerem, wystawiajacyTemp);
                    var pdfBytes = document.GeneratePdf();
                    
                    var fileName = $"faktura-{nowyNumerFaktury.Replace('/', '_')}.pdf";
                    var filePath = Path.Combine(organizedPath, fileName);
                    await System.IO.File.WriteAllBytesAsync(filePath, pdfBytes);
                    
                    var relativePath = Path.Combine("Generated", "Invoices", year.ToString(), month, fileName);
                    fakturaDoPdf.SciezkaPdf = relativePath;
                    await _context.SaveChangesAsync();
                    
                    Console.WriteLine($"PDF wygenerowany: {relativePath}");
                }
            }
            catch (Exception pdfEx)
            {
                Console.WriteLine($"Błąd PDF: {pdfEx.Message}");
            }
            
            await transaction.CommitAsync();
            
            return Ok(new 
            { 
                success = true,
                idFaktura = nowaFaktura.IdFaktura,
                numerFaktury = nowaFaktura.NumerFaktury,
                numerBazowyWPdf = numerBazowy,
                wersja = nowaFaktura.Wersja,
                kwotaBrutto = nowaFaktura.KwotaBrutto,
                message = $"Faktura zaktualizowana. Utworzono wersję {nowaWersja}"
            });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            Console.WriteLine($"Błąd aktualizacji faktury: {ex.Message}");
            return StatusCode(500, new { message = $"Błąd podczas aktualizacji faktury: {ex.Message}" });
        }
    }

    [HttpGet("{id}/pdf")]
    public async Task<IActionResult> GetFakturaPdf(uint id)
    {
        var faktura = await _context.FakturaVats.FindAsync(id);

        if (faktura == null)
        {
            return NotFound("Nie znaleziono faktury.");
        }
        
        if (!string.IsNullOrEmpty(faktura.SciezkaPdf))
        {
            var filePath = Path.Combine(Directory.GetCurrentDirectory(), faktura.SciezkaPdf);
            if (System.IO.File.Exists(filePath))
            {
                var pdfBytes = await System.IO.File.ReadAllBytesAsync(filePath);
                var fileName = Path.GetFileName(filePath);
                return File(pdfBytes, "application/pdf", fileName);
            }
        }
        
        var fakturaFull = await _context.FakturaVats
            .Include(f => f.IdKontrahentNavigation)
            .Include(f => f.FakturaVatPozycjas)
                .ThenInclude(p => p.IdUslugaNavigation)
            .FirstOrDefaultAsync(f => f.IdFaktura == id);

        if (fakturaFull == null)
        {
            return NotFound("Nie znaleziono faktury.");
        }
        
        // ⭐ Sprawdzenie NULL
        var wystawiajacyNazwa = "Brak danych";
        if (!string.IsNullOrEmpty(fakturaFull.IdUser))
        {
            var wystawiajacyUser = await _userManager.FindByIdAsync(fakturaFull.IdUser);
            wystawiajacyNazwa = wystawiajacyUser?.UserName ?? "Brak danych";
        }
        
        var wystawiajacy = new Uzytkownik { Login = wystawiajacyNazwa };

        var numerBazowy = fakturaFull.NumerFaktury.Split('_')[0];
        
        var fakturaDoGenerowania = new FakturaVat
        {
            IdFaktura = fakturaFull.IdFaktura,
            NumerFaktury = numerBazowy,
            DataWystawienia = fakturaFull.DataWystawienia,
            TerminPlatnosci = fakturaFull.TerminPlatnosci,
            FormaPlatnosci = fakturaFull.FormaPlatnosci,
            Zaplacono = fakturaFull.Zaplacono,
            KwotaNetto = fakturaFull.KwotaNetto,
            KwotaBrutto = fakturaFull.KwotaBrutto,
            KwotaVat = fakturaFull.KwotaVat,
            IdKontrahentNavigation = fakturaFull.IdKontrahentNavigation,
            FakturaVatPozycjas = fakturaFull.FakturaVatPozycjas
        };

        var document = new FakturaVatDocument(fakturaDoGenerowania, wystawiajacy);
        var pdfBytesNew = document.GeneratePdf();
        var fileNameNew = $"faktura-{numerBazowy.Replace('/', '_')}.pdf";

        return File(pdfBytesNew, "application/pdf", fileNameNew);
    }
    
    [HttpPost("send-email")]
    public IActionResult SendEmail()
    {
        return Ok("Wysyłka e-mail - w budowie");
    }
}

public class CreateFakturaVatDto
{
    public uint IdKontrahent { get; set; }
    public string NumerFaktury { get; set; } = string.Empty;
    public DateOnly DataWystawienia { get; set; }
    public DateOnly? TerminPlatnosci { get; set; }
    public string? FormaPlatnosci { get; set; }
    public decimal Zaplacono { get; set; }
    public List<FakturaVatPozycjaDto> Pozycje { get; set; } = new();
}

public class FakturaVatPozycjaDto
{
    public uint IdUsluga { get; set; }
    public decimal Ilosc { get; set; }
    public decimal CenaNetto { get; set; }
    public decimal StawkaVat { get; set; }
}
