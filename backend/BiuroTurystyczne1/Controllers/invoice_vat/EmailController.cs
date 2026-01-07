using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using BiuroTurystyczne1.Data.Models;
using BiuroTurystyczne1.Infrastructure.Email;
using BiuroTurystyczne1.Services; // ✅ DODANE
using System.IO;

namespace BiuroTurystyczne1.Controllers.invoice_vat;

[ApiController]
[Route("api/email")]
[Authorize]
public class EmailController : ControllerBase
{
    private readonly BiuroDbContext _context;
    private readonly IEmailService _emailService;
    private readonly IPdfService _pdfService; 
    private readonly string _fakturyFolderPath;

    public EmailController(
        BiuroDbContext context, 
        IEmailService emailService, 
        IPdfService pdfService, 
        IWebHostEnvironment env)
    {
        _context = context;
        _emailService = emailService;
        _pdfService = pdfService; 
        _fakturyFolderPath = Path.Combine(env.ContentRootPath, "Faktury");
    }

  [HttpPost("send-faktury")]
public async Task<IActionResult> SendFaktury([FromBody] SendFakturyEmailDto request)
{
    try
    {
        var faktury = await _context.FakturaVats
            .Include(f => f.IdKontrahentNavigation)
            .Where(f => request.IdFaktury.Contains(f.IdFaktura))
            .ToListAsync();

        if (!faktury.Any())
        {
            return NotFound("Nie znaleziono żadnych faktur.");
        }

        var attachments = new List<EmailAttachment>();
        var missingFiles = new List<string>();
        
        foreach (var faktura in faktury)
        {
            
            string filePath;
            string fileName = $"faktura-{faktura.NumerFaktury.Replace('/', '_')}.pdf"; 
            
            if (!string.IsNullOrEmpty(faktura.SciezkaPdf))
            {
                // Ścieżka relatywna z bazy
                filePath = Path.Combine(Directory.GetCurrentDirectory(), faktura.SciezkaPdf);
            }
            else
            {
                // Fallback - stara struktura
                filePath = Path.Combine(_fakturyFolderPath, fileName);
            }

            if (!System.IO.File.Exists(filePath))
            {
                missingFiles.Add($"{faktura.NumerFaktury} (ścieżka: {filePath})");
                continue;
            }

            // Wczytaj pełny PDF
            var fullPdfBytes = await System.IO.File.ReadAllBytesAsync(filePath);
            
            // Wyciągnij tylko pierwszą stronę (oryginał)
            var originalOnlyBytes = _pdfService.ExtractFirstPage(fullPdfBytes);
            
            
            
            attachments.Add(new EmailAttachment
            {
                FileName = fileName,
                Content = originalOnlyBytes,
                ContentType = "application/pdf"
            });
        }

        if (missingFiles.Any())
        {
            return BadRequest(new { 
                message = $"Nie znaleziono plików PDF dla faktur:",
                missingFiles = missingFiles
            });
        }

        if (!attachments.Any())
        {
            return BadRequest(new { message = "Brak plików PDF do wysłania." });
        }

        string? ccEmail = request.SendCopyToId1 ? await GetEmailForKontrahentId1() : null;
        
        await _emailService.SendEmailWithAttachmentsAsync(
            request.RecipientEmail,
            request.Subject,
            request.Body,
            attachments,
            ccEmail
        );

        return Ok(new { 
            message = "Email został wysłany pomyślnie",
            sentFiles = attachments.Count
        });
    }
    catch (Exception ex)
    {
        return StatusCode(500, new { message = $"Błąd podczas wysyłania emaila: {ex.Message}" });
    }
}


    private async Task<string?> GetEmailForKontrahentId1()
    {
        var kontrahent = await _context.Kontrahents.FindAsync((uint)1);
        return kontrahent?.Email;
    }
}

public class SendFakturyEmailDto
{
    public List<uint> IdFaktury { get; set; } = new();
    public string RecipientEmail { get; set; } = string.Empty;
    public string Subject { get; set; } = "Faktura prowizyjna";
    public string Body { get; set; } = "Dzień dobry,\n\nPrzesyłam fakturę prowizyjną.\n\nPozdrawiam";
    public bool SendCopyToId1 { get; set; } = false;
}
