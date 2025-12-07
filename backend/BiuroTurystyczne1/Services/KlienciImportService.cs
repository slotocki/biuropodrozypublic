using BiuroTurystyczne1.Data;
using BiuroTurystyczne1.Data.Models;
using BiuroTurystyczne1.DTOs;
using Microsoft.EntityFrameworkCore;

namespace BiuroTurystyczne1.Services;

public interface IKlienciImportService
{
    Task<ImportResultDto> ImportKlienciAsync(ImportKlientiDto dto);
}

public class KlienciImportService : IKlienciImportService
{
    private readonly BiuroDbContext _context;
    private readonly ILogger<KlienciImportService> _logger;

    public KlienciImportService(
        BiuroDbContext context,
        ILogger<KlienciImportService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<ImportResultDto> ImportKlienciAsync(ImportKlientiDto dto)
    {
        var result = new ImportResultDto
        {
            Total = dto.Clients.Count,
            Errors = new List<ImportErrorDto>()
        };

        if (dto.Clients.Count == 0)
        {
            result.Errors.Add(new ImportErrorDto 
            { 
                Client = "Brak danych",
                Error = "Lista klientów jest pusta"
            });
            return result;
        }

        foreach (var clientData in dto.Clients)
        {
            try
            {
                // Walidacja wymaganych pól
                if (string.IsNullOrWhiteSpace(clientData.Imie) || 
                    string.IsNullOrWhiteSpace(clientData.Nazwisko))
                {
                    result.Errors.Add(new ImportErrorDto
                    {
                        Client = $"{clientData.Nazwisko} {clientData.Imie}",
                        Error = "Brak imienia lub nazwiska"
                    });
                    continue;
                }

                // Sprawdzenie duplikatów (imie + nazwisko + telefon)
                var existing = await _context.Klients
                    .FirstOrDefaultAsync(k =>
                        k.Imie == clientData.Imie &&
                        k.Nazwisko == clientData.Nazwisko &&
                        k.Telefon == clientData.Telefon); 

                if (existing != null)
                {
                    result.Errors.Add(new ImportErrorDto
                    {
                        Client = $"{clientData.Nazwisko} {clientData.Imie}",
                        Error = "Klient już istnieje w bazie"
                    });
                    continue;
                }

                // Walidacja email jeśli podany
                if (!string.IsNullOrWhiteSpace(clientData.Email))
                {
                    var emailExists = await _context.Klients
                        .AnyAsync(k => k.Email == clientData.Email);
                    
                    if (emailExists)
                    {
                        result.Errors.Add(new ImportErrorDto
                        {
                            Client = $"{clientData.Nazwisko} {clientData.Imie}",
                            Error = "Email jest już w użyciu"
                        });
                        continue;
                    }
                }

                // Stworzenie nowego klienta
                var newClient = new Klient
                {
                    Imie = clientData.Imie.Trim(),
                    Nazwisko = clientData.Nazwisko.Trim(),
                    Ulica = clientData.Ulica?.Trim() ?? "",
                    KodPocztowy = clientData.KodPocztowy?.Trim() ?? "",
                    Miejscowosc = clientData.Miejscowosc?.Trim() ?? "",
                    Email = string.IsNullOrWhiteSpace(clientData.Email) ? null : clientData.Email?.Trim(), // ✅ NULL zamiast ""
                    Telefon = clientData.Telefon?.Trim() ?? "",
                    IdObywatelstwo = clientData.IdObywatelstwo.HasValue ? (uint)clientData.IdObywatelstwo : (uint?)null,
                    DataUrodzenia = clientData.DataUrodzenia.HasValue 
                        ? DateOnly.FromDateTime(clientData.DataUrodzenia.Value) 
                        : (DateOnly?)null,
                    Adnotacje = $"[IMPORT] {DateTime.Now:dd.MM.yyyy HH:mm}",
                    IdGrupa = clientData.IdGrupa.HasValue ? (uint)clientData.IdGrupa : (uint?)null
                };

                _context.Klients.Add(newClient);
                result.Imported++;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Błąd przy imporcie klienta");
                result.Errors.Add(new ImportErrorDto
                {
                    Client = $"{clientData.Nazwisko} {clientData.Imie}",
                    Error = ex.Message
                });
            }
        }

        // Zapisz wszystkich klientów naraz
        if (result.Imported > 0)
        {
            try
            {
                await _context.SaveChangesAsync();
                result.Success = true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Błąd podczas zapisu do bazy");
                result.Success = false;
                result.Errors.Add(new ImportErrorDto
                {
                    Client = "Zapis do bazy",
                    Error = ex.Message
                });
                result.Imported = 0;
            }
        }

        return result;
    }
}
