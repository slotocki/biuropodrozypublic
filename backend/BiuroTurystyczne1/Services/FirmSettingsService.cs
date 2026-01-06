using BiuroTurystyczne1.Data.Models;
using Microsoft.EntityFrameworkCore;
using DocumentFirmSettings = BiuroTurystyczne1.Infrastructure.Documents.FirmSettings;

namespace BiuroTurystyczne1.Services;

public interface IFirmSettingsService
{
    Task<DocumentFirmSettings> GetDocumentFirmSettingsAsync();
}

public class FirmSettingsService : IFirmSettingsService
{
    private readonly BiuroDbContext _context;

    public FirmSettingsService(BiuroDbContext context)
    {
        _context = context;
    }

    public async Task<DocumentFirmSettings> GetDocumentFirmSettingsAsync()
    {
        var dbSettings = await _context.FirmSettings.FirstOrDefaultAsync();
        
        var logoPath = Path.Combine(Directory.GetCurrentDirectory(), "Resources", "logo.png");
        
        return new DocumentFirmSettings
        {
            NazwaFirmy = dbSettings?.NazwaFirmy ?? "",
            Adres = dbSettings?.Adres ?? "",
            NIP = dbSettings?.NIP ?? "",
            Telefon = dbSettings?.Telefon ?? "",
            Bank = dbSettings?.Bank ?? "",
            NumerKonta = dbSettings?.NumerKonta ?? "",
            MiejsceWystawienia = dbSettings?.MiejsceWystawienia ?? "",
            LogoPath = File.Exists(logoPath) ? logoPath : null
        };
    }
}

