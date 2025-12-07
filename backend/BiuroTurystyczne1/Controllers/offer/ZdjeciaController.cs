// Controllers/offer/ZdjeciaController.cs
using BiuroTurystyczne1.Data.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BiuroTurystyczne1.Controllers.offer;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ZdjeciaController : ControllerBase
{
    private readonly BiuroDbContext _context;
    private readonly IWebHostEnvironment _environment;
    private readonly IConfiguration _configuration;
    private readonly ILogger<ZdjeciaController> _logger;

    public ZdjeciaController(
        BiuroDbContext context,
        IWebHostEnvironment environment,
        IConfiguration configuration,
        ILogger<ZdjeciaController> logger)
    {
        _context = context;
        _environment = environment;
        _configuration = configuration;
        _logger = logger;
    }

    private string GetPhotoFolderPath()
    {
        var photoPath = _configuration["FileStorage:PhotoPath"] ?? "wwwroot/uploads/photos";
        return Path.Combine(Directory.GetCurrentDirectory(), photoPath);
    }

    // GET: api/Zdjecia?search=term
    [HttpGet]
    public async Task<IActionResult> GetZdjecia([FromQuery] string? search = null)
    {
        var query = _context.Zdjecia
            .Include(z => z.IdOsrodekNavigation)
            .Include(z => z.IdDestynacjaNavigation)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            search = search.ToLower();
            
            var byTags = query.Where(z => z.Tagi != null && z.Tagi.ToLower().Contains(search));
            var byDesc = query.Where(z => 
                (z.Tagi == null || !z.Tagi.ToLower().Contains(search)) &&
                z.OpisZdjecia != null && z.OpisZdjecia.ToLower().Contains(search));
            
            query = byTags.Union(byDesc);
        }

        var result = await query
            .OrderByDescending(z => z.CzyGlowne)
            .ThenByDescending(z => z.IdZdjecie)
            .Select(z => new
            {
                z.IdZdjecie,
                z.IdOsrodek,
                z.IdDestynacja,
                z.SciezkaPliku,
                z.OpisZdjecia,
                z.Tagi,
                z.CzyGlowne,  // ✅ Już jest bool
                NazwaOsrodka = z.IdOsrodekNavigation != null ? z.IdOsrodekNavigation.NazwaOsrodka : null,
                NazwaDestynacji = z.IdDestynacjaNavigation != null ? z.IdDestynacjaNavigation.Nazwa : null
            })
            .ToListAsync();

        return Ok(result);
    }

    // GET: api/Zdjecia/5
    [HttpGet("{id}")]
    public async Task<IActionResult> GetZdjecie(int id)
    {
        var zdjecie = await _context.Zdjecia
            .Include(z => z.IdOsrodekNavigation)
            .Include(z => z.IdDestynacjaNavigation)
            .Where(z => z.IdZdjecie == id)
            .Select(z => new
            {
                z.IdZdjecie,
                z.IdOsrodek,
                z.IdDestynacja,
                z.SciezkaPliku,
                z.OpisZdjecia,
                z.Tagi,
                z.CzyGlowne,  // ✅ Już jest bool
                NazwaOsrodka = z.IdOsrodekNavigation != null ? z.IdOsrodekNavigation.NazwaOsrodka : null,
                NazwaDestynacji = z.IdDestynacjaNavigation != null ? z.IdDestynacjaNavigation.Nazwa : null
            })
            .FirstOrDefaultAsync();

        if (zdjecie == null) return NotFound();
        return Ok(zdjecie);
    }

    // POST: api/Zdjecia/upload-multiple
    [HttpPost("upload-multiple")]
    public async Task<IActionResult> UploadMultipleZdjecia([FromForm] UploadMultipleZdjeciaDto dto)
    {
        if (dto.Pliki == null || dto.Pliki.Count == 0)
        {
            return BadRequest(new { message = "Nie wybrano żadnych plików." });
        }

        var uploadPath = GetPhotoFolderPath();
        if (!Directory.Exists(uploadPath))
        {
            Directory.CreateDirectory(uploadPath);
        }

        var uploadedFiles = new List<object>();
        var opisyArray = dto.Opisy?.Split('|') ?? Array.Empty<string>();

        for (int i = 0; i < dto.Pliki.Count; i++)
        {
            var plik = dto.Pliki[i];
            if (plik.Length == 0) continue;

            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
            var extension = Path.GetExtension(plik.FileName).ToLower();
            
            if (!allowedExtensions.Contains(extension))
            {
                return BadRequest(new { message = $"Niedozwolony format pliku: {plik.FileName}" });
            }

            var uniqueFileName = $"{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(uploadPath, uniqueFileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await plik.CopyToAsync(stream);
            }

            var opisZdjecia = i < opisyArray.Length ? opisyArray[i] : "";

            var zdjecie = new Zdjecium
            {
                IdOsrodek = dto.IdOsrodek,
                IdDestynacja = dto.IdDestynacja,
                SciezkaPliku = $"/uploads/photos/{uniqueFileName}",
                OpisZdjecia = opisZdjecia,
                Tagi = dto.Tagi,
                CzyGlowne = i == 0 && dto.CzyGlowne  // ✅ bool = bool
            };

            _context.Zdjecia.Add(zdjecie);
            await _context.SaveChangesAsync();

            uploadedFiles.Add(new
            {
                zdjecie.IdZdjecie,
                zdjecie.SciezkaPliku,
                zdjecie.OpisZdjecia
            });
        }

        return Ok(new { message = $"Przesłano {uploadedFiles.Count} zdjęć.", zdjecia = uploadedFiles });
    }

    // PUT: api/Zdjecia/5
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateZdjecie(int id, [FromBody] UpdateZdjecieDto dto)
    {
        var zdjecie = await _context.Zdjecia.FindAsync((uint)id);
        if (zdjecie == null) return NotFound();

        zdjecie.IdOsrodek = dto.IdOsrodek;
        zdjecie.IdDestynacja = dto.IdDestynacja;
        zdjecie.OpisZdjecia = dto.OpisZdjecia;
        zdjecie.Tagi = dto.Tagi;
        zdjecie.CzyGlowne = dto.CzyGlowne;  // ✅ bool = bool

        await _context.SaveChangesAsync();
        return Ok(new { message = "Zdjęcie zaktualizowane." });
    }

    // DELETE: api/Zdjecia/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteZdjecie(int id)
    {
        var zdjecie = await _context.Zdjecia.FindAsync((uint)id);
        if (zdjecie == null) return NotFound();

        if (!string.IsNullOrEmpty(zdjecie.SciezkaPliku))
        {
            var filePath = Path.Combine(Directory.GetCurrentDirectory(), zdjecie.SciezkaPliku.TrimStart('/'));
            if (System.IO.File.Exists(filePath))
            {
                try
                {
                    System.IO.File.Delete(filePath);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Błąd podczas usuwania pliku: {FilePath}", filePath);
                }
            }
        }

        _context.Zdjecia.Remove(zdjecie);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Zdjęcie usunięte." });
    }

    // GET: api/Zdjecia/osrodki
    [HttpGet("osrodki")]
    public async Task<IActionResult> GetOsrodki()
    {
        var osrodki = await _context.Osrodeks
            .Select(o => new { o.IdOsrodek, o.NazwaOsrodka })
            .OrderBy(o => o.NazwaOsrodka)
            .ToListAsync();
        return Ok(osrodki);
    }

    // GET: api/Zdjecia/destynacje
    [HttpGet("destynacje")]
    public async Task<IActionResult> GetDestynacje()
    {
        var destynacje = await _context.Destynacjas
            .Select(d => new { d.IdDestynacja, d.Nazwa })
            .OrderBy(d => d.Nazwa)
            .ToListAsync();
        return Ok(destynacje);
    }
}

// DTOs
public class UploadMultipleZdjeciaDto
{
    public List<IFormFile> Pliki { get; set; } = new();
    public uint? IdOsrodek { get; set; }
    public uint? IdDestynacja { get; set; }
    public string? Opisy { get; set; }
    public string? Tagi { get; set; }
    public bool CzyGlowne { get; set; }
}

public class UpdateZdjecieDto
{
    public uint? IdOsrodek { get; set; }
    public uint? IdDestynacja { get; set; }
    public string? OpisZdjecia { get; set; }
    public string? Tagi { get; set; }
    public bool CzyGlowne { get; set; }
}
