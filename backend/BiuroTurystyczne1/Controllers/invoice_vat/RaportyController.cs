using BiuroTurystyczne1.Data.Models;
using BiuroTurystyczne1.Infrastructure.Documents;
using BiuroTurystyczne1.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using DocumentFirmSettings = BiuroTurystyczne1.Infrastructure.Documents.FirmSettings;
namespace BiuroTurystyczne1.Controllers.invoice_vat;

[ApiController]
[Route("api/raporty")]
[Authorize]
public class RaportyController : ControllerBase
{
    private readonly BiuroDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly IFirmSettingsService _firmSettingsService;

    public RaportyController(BiuroDbContext context, IConfiguration configuration, IFirmSettingsService firmSettingsService)
    {
        _context = context;
        _configuration = configuration;
        _firmSettingsService = firmSettingsService;
    }

    private async Task<DocumentFirmSettings> GetFirmSettingsAsync()
    {
        return await _firmSettingsService.GetDocumentFirmSettingsAsync();
    }

 
    // Pobiera listę dostępnych miesięcy z fakturami
    
    [HttpGet("dostepne-miesiace")]
    public async Task<IActionResult> GetDostepneMiesiace()
    {
        var miesiace = await _context.FakturaVats
            .Select(f => new { f.DataWystawienia.Year, f.DataWystawienia.Month })
            .Distinct()
            .OrderByDescending(x => x.Year)
            .ThenByDescending(x => x.Month)
            .ToListAsync();

        return Ok(miesiace.Select(m => new
        {
            rok = m.Year,
            miesiac = m.Month,
            etykieta = $"{GetNazwaMiesiaca(m.Month)} {m.Year}"
        }));
    }

    
    // Pobiera szczegółowy raport dla wybranego miesiąca
  
    [HttpGet("{rok}/{miesiac}")]
    public async Task<IActionResult> GetRaportMiesieczny(int rok, int miesiac)
    {
        if (miesiac < 1 || miesiac > 12)
            return BadRequest(new { message = "Nieprawidłowy miesiąc" });

        var startDate = new DateOnly(rok, miesiac, 1);
        var endDate = startDate.AddMonths(1).AddDays(-1);

        var faktury = await _context.FakturaVats
            .Include(f => f.IdKontrahentNavigation)
            .Include(f => f.FakturaVatPozycjas)
            .Where(f => f.DataWystawienia >= startDate && f.DataWystawienia <= endDate)
            .OrderBy(f => f.DataWystawienia)
            .ToListAsync();

        if (!faktury.Any())
        {
            return Ok(new RaportMiesiecznyDto
            {
                Rok = rok,
                Miesiac = miesiac,
                NazwaMiesiaca = GetNazwaMiesiaca(miesiac),
                LiczbaFaktur = 0,
                LiczbaKorekt = 0,
                SumaNetto = 0,
                SumaVat = 0,
                SumaBrutto = 0,
                VatWgStawek = new List<VatStawkaDto>(),
                SprzedazDzienna = new List<SprzedazDziennaDto>(),
                Faktury = new List<FakturaRaportDto>()
            });
        }

        // Statystyki podstawowe
        var fakturyPierwotne = faktury.Where(f => (f.TypDokumentu ?? "FAKTURA") == "FAKTURA").ToList();
        var korekty = faktury.Where(f => f.TypDokumentu == "KOREKTA").ToList();

        var sumaNetto = faktury.Sum(f => f.KwotaNetto);
        var sumaVat = faktury.Sum(f => f.KwotaVat);
        var sumaBrutto = faktury.Sum(f => f.KwotaBrutto);

        // VAT z rozbiciem na stawki
        var vatWgStawek = new Dictionary<decimal, decimal>();
        foreach (var faktura in faktury)
        {
            foreach (var pozycja in faktura.FakturaVatPozycjas)
            {
                var stawka = pozycja.StawkaVat;
                var kwotaVat = pozycja.CenaNetto * pozycja.Ilosc * (stawka / 100);
                
                if (!vatWgStawek.ContainsKey(stawka))
                    vatWgStawek[stawka] = 0;
                vatWgStawek[stawka] += kwotaVat;
            }
        }

        // Sprzedaż dzienna
        var sprzedazDzienna = faktury
            .GroupBy(f => f.DataWystawienia)
            .Select(g => new SprzedazDziennaDto
            {
                Data = g.Key.ToString("yyyy-MM-dd"),
                Dzien = g.Key.Day,
                SumaBrutto = g.Sum(f => f.KwotaBrutto),
                LiczbaFaktur = g.Count()
            })
            .OrderBy(x => x.Dzien)
            .ToList();

        // Lista faktur
        var listaFaktur = faktury.Select(f => new FakturaRaportDto
        {
            IdFaktura = f.IdFaktura,
            NumerFaktury = f.NumerFaktury,
            DataWystawienia = f.DataWystawienia.ToString("yyyy-MM-dd"),
            NazwaKontrahenta = f.IdKontrahentNavigation?.NazwaFirmy ?? "Brak",
            NipKontrahenta = f.IdKontrahentNavigation?.Nip ?? "Brak",
            KwotaNetto = f.KwotaNetto,
            KwotaVat = f.KwotaVat,
            KwotaBrutto = f.KwotaBrutto,
            TypDokumentu = f.TypDokumentu ?? "FAKTURA"
        }).ToList();

        return Ok(new RaportMiesiecznyDto
        {
            Rok = rok,
            Miesiac = miesiac,
            NazwaMiesiaca = GetNazwaMiesiaca(miesiac),
            LiczbaFaktur = fakturyPierwotne.Count,
            LiczbaKorekt = korekty.Count,
            SumaNetto = sumaNetto,
            SumaVat = sumaVat,
            SumaBrutto = sumaBrutto,
            VatWgStawek = vatWgStawek.Select(kv => new VatStawkaDto
            {
                Stawka = kv.Key,
                Kwota = kv.Value,
                Etykieta = kv.Key == 0 ? "zw" : $"{kv.Key}%"
            }).OrderByDescending(x => x.Stawka).ToList(),
            SprzedazDzienna = sprzedazDzienna,
            Faktury = listaFaktur
        });
    }

  
    // Generuje PDF raportu miesięcznego
    
    [HttpGet("{rok}/{miesiac}/pdf")]
    public async Task<IActionResult> GetRaportPdf(int rok, int miesiac)
    {
        if (miesiac < 1 || miesiac > 12)
            return BadRequest(new { message = "Nieprawidłowy miesiąc" });

        var startDate = new DateOnly(rok, miesiac, 1);
        var endDate = startDate.AddMonths(1).AddDays(-1);

        var faktury = await _context.FakturaVats
            .Include(f => f.IdKontrahentNavigation)
            .Include(f => f.FakturaVatPozycjas)
            .Where(f => f.DataWystawienia >= startDate && f.DataWystawienia <= endDate)
            .OrderBy(f => f.DataWystawienia)
            .ToListAsync();

        var firmSettings = await GetFirmSettingsAsync();
        var document = new RaportMiesiecznyDocument(faktury, rok, miesiac, firmSettings);
        var pdfBytes = document.GeneratePdf();

        var fileName = $"raport-{rok}-{miesiac:D2}.pdf";
        return File(pdfBytes, "application/pdf", fileName);
    }

    
    // Wysyła raport na email księgowości
   
    [HttpPost("{rok}/{miesiac}/wyslij-do-ksiegowosci")]
    public async Task<IActionResult> WyslijDoKsiegowosci(int rok, int miesiac)
    {
        if (miesiac < 1 || miesiac > 12)
            return BadRequest(new { message = "Nieprawidłowy miesiąc" });

        // Pobierz email księgowości z bazy danych
        var firmSettings = await _context.FirmSettings.FirstOrDefaultAsync();
        var emailKsiegowosci = firmSettings?.EmailKsiegowosci;

        // Jeśli brak w bazie, użyj fallback z konfiguracji
        if (string.IsNullOrEmpty(emailKsiegowosci))
        {
            emailKsiegowosci = _configuration["FirmSettings:EmailKsiegowosci"] 
                ?? _configuration["EmailSettings:SenderEmail"];
        }

        if (string.IsNullOrEmpty(emailKsiegowosci))
        {
            return BadRequest(new { message = "Brak skonfigurowanego adresu email księgowości. Ustaw go w Ustawieniach Firmy." });
        }

        var startDate = new DateOnly(rok, miesiac, 1);
        var endDate = startDate.AddMonths(1).AddDays(-1);

        var faktury = await _context.FakturaVats
            .Include(f => f.IdKontrahentNavigation)
            .Include(f => f.FakturaVatPozycjas)
            .Where(f => f.DataWystawienia >= startDate && f.DataWystawienia <= endDate)
            .OrderBy(f => f.DataWystawienia)
            .ToListAsync();

        if (!faktury.Any())
        {
            return BadRequest(new { message = "Brak faktur w wybranym okresie" });
        }

        // Oblicz statystyki
        var sumaNetto = faktury.Sum(f => f.KwotaNetto);
        var sumaVat = faktury.Sum(f => f.KwotaVat);
        var sumaBrutto = faktury.Sum(f => f.KwotaBrutto);
        var liczbaFaktur = faktury.Count(f => (f.TypDokumentu ?? "FAKTURA") == "FAKTURA");
        var liczbaKorekt = faktury.Count(f => f.TypDokumentu == "KOREKTA");

        // Generuj PDF
        var documentFirmSettings = await GetFirmSettingsAsync();
        var document = new RaportMiesiecznyDocument(faktury, rok, miesiac, documentFirmSettings);
        var pdfBytes = document.GeneratePdf();

        // Wyślij email
        try
        {
            var smtpHost = _configuration["EmailSettings:SmtpHost"];
            var smtpPort = int.Parse(_configuration["EmailSettings:SmtpPort"] ?? "587");
            var smtpUser = _configuration["EmailSettings:SmtpUser"];
            var smtpPass = _configuration["EmailSettings:SmtpPass"];
            var senderEmail = _configuration["EmailSettings:SenderEmail"];
            var senderName = _configuration["EmailSettings:SenderName"] ?? "Biuro Turystyczne";

            using var client = new System.Net.Mail.SmtpClient(smtpHost, smtpPort);
            client.Credentials = new System.Net.NetworkCredential(smtpUser, smtpPass);
            client.EnableSsl = bool.Parse(_configuration["EmailSettings:UseSsl"] ?? "true");

            var mailMessage = new System.Net.Mail.MailMessage
            {
                From = new System.Net.Mail.MailAddress(senderEmail!, senderName),
                Subject = $"Raport miesięczny - {GetNazwaMiesiaca(miesiac)} {rok}",
                IsBodyHtml = true,
                Body = $@"
                    <html>
                    <body style='font-family: Arial, sans-serif;'>
                        <h2>Raport miesięczny - {GetNazwaMiesiaca(miesiac)} {rok}</h2>
                        <p>W załączniku przesyłamy raport miesięczny z zestawieniem faktur.</p>
                        
                        <h3>Podsumowanie:</h3>
                        <table style='border-collapse: collapse; width: 400px;'>
                            <tr style='background-color: #f2f2f2;'>
                                <td style='padding: 8px; border: 1px solid #ddd;'>Liczba faktur:</td>
                                <td style='padding: 8px; border: 1px solid #ddd; text-align: right;'><strong>{liczbaFaktur}</strong></td>
                            </tr>
                            <tr>
                                <td style='padding: 8px; border: 1px solid #ddd;'>Liczba korekt:</td>
                                <td style='padding: 8px; border: 1px solid #ddd; text-align: right;'><strong>{liczbaKorekt}</strong></td>
                            </tr>
                            <tr style='background-color: #f2f2f2;'>
                                <td style='padding: 8px; border: 1px solid #ddd;'>Suma netto:</td>
                                <td style='padding: 8px; border: 1px solid #ddd; text-align: right;'><strong>{sumaNetto:N2} zł</strong></td>
                            </tr>
                            <tr>
                                <td style='padding: 8px; border: 1px solid #ddd;'>Suma VAT:</td>
                                <td style='padding: 8px; border: 1px solid #ddd; text-align: right;'><strong>{sumaVat:N2} zł</strong></td>
                            </tr>
                            <tr style='background-color: #e8f5e9;'>
                                <td style='padding: 8px; border: 1px solid #ddd;'><strong>Suma brutto:</strong></td>
                                <td style='padding: 8px; border: 1px solid #ddd; text-align: right;'><strong>{sumaBrutto:N2} zł</strong></td>
                            </tr>
                        </table>
                        
                        <p style='margin-top: 20px; color: #666;'>
                            Wiadomość wygenerowana automatycznie przez system {documentFirmSettings.NazwaFirmy}
                        </p>
                    </body>
                    </html>"
            };

            mailMessage.To.Add(emailKsiegowosci);
            
            var attachment = new System.Net.Mail.Attachment(
                new MemoryStream(pdfBytes), 
                $"raport-{rok}-{miesiac:D2}.pdf", 
                "application/pdf");
            mailMessage.Attachments.Add(attachment);

            await client.SendMailAsync(mailMessage);

            return Ok(new { 
                success = true, 
                message = $"Raport został wysłany na adres {emailKsiegowosci}" 
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { 
                success = false, 
                message = $"Błąd podczas wysyłania emaila: {ex.Message}" 
            });
        }
    }

    private static string GetNazwaMiesiaca(int miesiac)
    {
        return miesiac switch
        {
            1 => "Styczeń",
            2 => "Luty",
            3 => "Marzec",
            4 => "Kwiecień",
            5 => "Maj",
            6 => "Czerwiec",
            7 => "Lipiec",
            8 => "Sierpień",
            9 => "Wrzesień",
            10 => "Październik",
            11 => "Listopad",
            12 => "Grudzień",
            _ => "Nieznany"
        };
    }
}

// DTOs
public class RaportMiesiecznyDto
{
    public int Rok { get; set; }
    public int Miesiac { get; set; }
    public string NazwaMiesiaca { get; set; } = "";
    public int LiczbaFaktur { get; set; }
    public int LiczbaKorekt { get; set; }
    public decimal SumaNetto { get; set; }
    public decimal SumaVat { get; set; }
    public decimal SumaBrutto { get; set; }
    public List<VatStawkaDto> VatWgStawek { get; set; } = new();
    public List<SprzedazDziennaDto> SprzedazDzienna { get; set; } = new();
    public List<FakturaRaportDto> Faktury { get; set; } = new();
}

public class VatStawkaDto
{
    public decimal Stawka { get; set; }
    public decimal Kwota { get; set; }
    public string Etykieta { get; set; } = "";
}

public class SprzedazDziennaDto
{
    public string Data { get; set; } = "";
    public int Dzien { get; set; }
    public decimal SumaBrutto { get; set; }
    public int LiczbaFaktur { get; set; }
}

public class FakturaRaportDto
{
    public uint IdFaktura { get; set; }
    public string NumerFaktury { get; set; } = "";
    public string DataWystawienia { get; set; } = "";
    public string NazwaKontrahenta { get; set; } = "";
    public string NipKontrahenta { get; set; } = "";
    public decimal KwotaNetto { get; set; }
    public decimal KwotaVat { get; set; }
    public decimal KwotaBrutto { get; set; }
    public string TypDokumentu { get; set; } = "";
}
