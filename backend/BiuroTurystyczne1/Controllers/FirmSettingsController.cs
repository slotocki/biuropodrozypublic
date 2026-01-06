using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BiuroTurystyczne1.Data.Models;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;

namespace BiuroTurystyczne1.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class FirmSettingsController : ControllerBase
{
    private readonly BiuroDbContext _context;
    private const int LogoWidth = 428;
    private const int LogoHeight = 261;

    public FirmSettingsController(BiuroDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<FirmSettings>> GetSettings()
    {
        var settings = await _context.FirmSettings.FirstOrDefaultAsync();
        if (settings == null)
        {
            settings = new FirmSettings();
            _context.FirmSettings.Add(settings);
            await _context.SaveChangesAsync();
        }
        return Ok(settings);
    }

    [HttpPut]
    public async Task<IActionResult> UpdateSettings([FromBody] FirmSettings settings)
    {
        var existing = await _context.FirmSettings.FirstOrDefaultAsync();
        if (existing == null)
        {
            _context.FirmSettings.Add(settings);
        }
        else
        {
            existing.NazwaFirmy = settings.NazwaFirmy;
            existing.Adres = settings.Adres;
            existing.NIP = settings.NIP;
            existing.Telefon = settings.Telefon;
            existing.Bank = settings.Bank;
            existing.NumerKonta = settings.NumerKonta;
            existing.MiejsceWystawienia = settings.MiejsceWystawienia;
            existing.EmailKsiegowosci = settings.EmailKsiegowosci;
        }

        await _context.SaveChangesAsync();
        
        var updated = await _context.FirmSettings.FirstOrDefaultAsync();
        return Ok(updated);
    }

    [HttpPost("upload-logo")]
    public async Task<IActionResult> UploadLogo(IFormFile logo)
    {
        if (logo == null || logo.Length == 0)
            return BadRequest(new { message = "Nie wybrano pliku" });

        var allowedExtensions = new[] { ".png", ".jpg", ".jpeg" };
        var extension = Path.GetExtension(logo.FileName).ToLowerInvariant();

        if (!allowedExtensions.Contains(extension))
            return BadRequest(new { message = "Dozwolone są tylko pliki PNG, JPG i JPEG" });

        try
        {
            var resourcesPath = Path.Combine(Directory.GetCurrentDirectory(), "Resources");
            var fullPath = Path.Combine(resourcesPath, "logo.png");
            var tempPath = Path.Combine(resourcesPath, $"logo_temp_{Guid.NewGuid()}.png");

            if (!Directory.Exists(resourcesPath))
                Directory.CreateDirectory(resourcesPath);

            using var inputStream = logo.OpenReadStream();
            using var image = await Image.LoadAsync(inputStream);

            // Skalowanie z zachowaniem proporcji do 428x261
            image.Mutate(x => x.Resize(new ResizeOptions
            {
                Size = new Size(LogoWidth, LogoHeight),
                Mode = ResizeMode.Pad,
                PadColor = Color.Transparent
            }));

            // Zapisz do pliku tymczasowego
            await image.SaveAsPngAsync(tempPath);

            // Usuń stary plik jeśli istnieje
            if (System.IO.File.Exists(fullPath))
            {
                try
                {
                    System.IO.File.Delete(fullPath);
                }
                catch
                {
                    // Jeśli nie można usunąć, poczekaj chwilę i spróbuj ponownie
                    await Task.Delay(100);
                    System.IO.File.Delete(fullPath);
                }
            }

            // Przenieś plik tymczasowy na miejsce docelowe
            System.IO.File.Move(tempPath, fullPath);

            return Ok(new { message = "Logo zostało zaktualizowane" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Błąd przetwarzania obrazu: {ex.Message}" });
        }
    }

    [HttpGet("logo")]
    [AllowAnonymous]
    public IActionResult GetLogo()
    {
        var logoPath = Path.Combine(Directory.GetCurrentDirectory(), "Resources", "logo.png");

        if (!System.IO.File.Exists(logoPath))
            return NotFound();

        var fileBytes = System.IO.File.ReadAllBytes(logoPath);
        return File(fileBytes, "image/png");
    }
}
