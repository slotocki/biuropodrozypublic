using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace BiuroTurystyczne1.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly UserManager<IdentityUser> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly IConfiguration _configuration;
    private readonly IWebHostEnvironment _environment;

    public AdminController(
        UserManager<IdentityUser> userManager, 
        RoleManager<IdentityRole> roleManager,
        IConfiguration configuration,
        IWebHostEnvironment environment)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _configuration = configuration;
        _environment = environment;
    }

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers()
    {
        var users = await _userManager.Users.ToListAsync();
        var userList = new List<object>();

        foreach (var user in users)
        {
            var roles = await _userManager.GetRolesAsync(user);
            userList.Add(new
            {
                user.Id,
                user.Email,
                user.UserName,
                user.EmailConfirmed,
                Roles = roles
            });
        }

        return Ok(userList);
    }

    [HttpPost("users")]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserDto dto)
    {
        var user = new IdentityUser
        {
            UserName = dto.UserName ?? dto.Email, // Użyj UserName jeśli podane, w przeciwnym razie Email
            Email = dto.Email,
            EmailConfirmed = true
        };

        var result = await _userManager.CreateAsync(user, dto.Password);

        if (!result.Succeeded)
        {
            return BadRequest(new { errors = result.Errors.Select(e => e.Description) });
        }

        if (!string.IsNullOrEmpty(dto.Role))
        {
            await _userManager.AddToRoleAsync(user, dto.Role);
        }

        return Ok(new { message = "Użytkownik utworzony", userId = user.Id });
    }

    [HttpPut("users/{id}")]
    public async Task<IActionResult> UpdateUser(string id, [FromBody] UpdateUserDto dto)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null) return NotFound(new { message = "Nie znaleziono użytkownika" });

        user.Email = dto.Email;
        user.UserName = dto.UserName ?? dto.Email; // Użyj UserName jeśli podane, w przeciwnym razie Email

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded) return BadRequest(new { errors = result.Errors.Select(e => e.Description) });

        // Zmień role
        var currentRoles = await _userManager.GetRolesAsync(user);
        await _userManager.RemoveFromRolesAsync(user, currentRoles);
        
        if (!string.IsNullOrEmpty(dto.Role))
        {
            await _userManager.AddToRoleAsync(user, dto.Role);
        }

        return Ok(new { message = "Użytkownik zaktualizowany" });
    }

    // ✅ Nowy endpoint - resetowanie hasła
    [HttpPost("users/{id}/reset-password")]
    public async Task<IActionResult> ResetPassword(string id, [FromBody] ResetPasswordDto dto)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null) return NotFound(new { message = "Nie znaleziono użytkownika" });

        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        var result = await _userManager.ResetPasswordAsync(user, token, dto.NewPassword);

        if (!result.Succeeded)
        {
            return BadRequest(new { errors = result.Errors.Select(e => e.Description) });
        }

        return Ok(new { message = "Hasło zostało zresetowane" });
    }

    [HttpDelete("users/{id}")]
    public async Task<IActionResult> DeleteUser(string id)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null) return NotFound(new { message = "Nie znaleziono użytkownika" });

        var result = await _userManager.DeleteAsync(user);
        if (!result.Succeeded) return BadRequest(new { errors = result.Errors.Select(e => e.Description) });

        return Ok(new { message = "Użytkownik usunięty" });
    }

    [HttpGet("roles")]
    public async Task<IActionResult> GetRoles()
    {
        var roles = await _roleManager.Roles.Select(r => r.Name).ToListAsync();
        return Ok(roles);
    }

    /// <summary>
    /// Pobiera ustawienia firmy bezpośrednio z pliku konfiguracyjnego
    /// </summary>
    [HttpGet("firm-settings")]
    public async Task<IActionResult> GetFirmSettings()
    {
        try
        {
            var appSettingsPath = Path.Combine(_environment.ContentRootPath, "appsettings.json");
            
            if (!System.IO.File.Exists(appSettingsPath))
            {
                // Fallback do konfiguracji w pamięci
                return Ok(new FirmSettingsDto
                {
                    NazwaFirmy = _configuration["FirmSettings:NazwaFirmy"] ?? "",
                    Adres = _configuration["FirmSettings:Adres"] ?? "",
                    NIP = _configuration["FirmSettings:NIP"] ?? "",
                    Telefon = _configuration["FirmSettings:Telefon"] ?? "",
                    Bank = _configuration["FirmSettings:Bank"] ?? "",
                    NumerKonta = _configuration["FirmSettings:NumerKonta"] ?? "",
                    MiejsceWystawienia = _configuration["FirmSettings:MiejsceWystawienia"] ?? "",
                    EmailKsiegowosci = _configuration["FirmSettings:EmailKsiegowosci"] ?? ""
                });
            }

            // Czytaj bezpośrednio z pliku aby mieć aktualne dane
            var jsonString = await System.IO.File.ReadAllTextAsync(appSettingsPath);
            using var jsonDoc = JsonDocument.Parse(jsonString);
            
            var firmSettings = jsonDoc.RootElement.GetProperty("FirmSettings");
            
            var settings = new FirmSettingsDto
            {
                NazwaFirmy = firmSettings.TryGetProperty("NazwaFirmy", out var nf) ? nf.GetString() ?? "" : "",
                Adres = firmSettings.TryGetProperty("Adres", out var ad) ? ad.GetString() ?? "" : "",
                NIP = firmSettings.TryGetProperty("NIP", out var nip) ? nip.GetString() ?? "" : "",
                Telefon = firmSettings.TryGetProperty("Telefon", out var tel) ? tel.GetString() ?? "" : "",
                Bank = firmSettings.TryGetProperty("Bank", out var bank) ? bank.GetString() ?? "" : "",
                NumerKonta = firmSettings.TryGetProperty("NumerKonta", out var nk) ? nk.GetString() ?? "" : "",
                MiejsceWystawienia = firmSettings.TryGetProperty("MiejsceWystawienia", out var mw) ? mw.GetString() ?? "" : "",
                EmailKsiegowosci = firmSettings.TryGetProperty("EmailKsiegowosci", out var ek) ? ek.GetString() ?? "" : ""
            };
            
            return Ok(settings);
        }
        catch (Exception)
        {
            // Fallback do konfiguracji w pamięci w przypadku błędu
            return Ok(new FirmSettingsDto
            {
                NazwaFirmy = _configuration["FirmSettings:NazwaFirmy"] ?? "",
                Adres = _configuration["FirmSettings:Adres"] ?? "",
                NIP = _configuration["FirmSettings:NIP"] ?? "",
                Telefon = _configuration["FirmSettings:Telefon"] ?? "",
                Bank = _configuration["FirmSettings:Bank"] ?? "",
                NumerKonta = _configuration["FirmSettings:NumerKonta"] ?? "",
                MiejsceWystawienia = _configuration["FirmSettings:MiejsceWystawienia"] ?? "",
                EmailKsiegowosci = _configuration["FirmSettings:EmailKsiegowosci"] ?? ""
            });
        }
    }

    /// <summary>
    /// Zapisuje ustawienia firmy do pliku JSON i zwraca zapisane dane
    /// </summary>
    [HttpPut("firm-settings")]
    public async Task<IActionResult> UpdateFirmSettings([FromBody] FirmSettingsDto settings)
    {
        try
        {
            var appSettingsPath = Path.Combine(_environment.ContentRootPath, "appsettings.json");
            
            if (!System.IO.File.Exists(appSettingsPath))
            {
                return NotFound(new { message = "Nie znaleziono pliku konfiguracyjnego" });
            }

            var jsonString = await System.IO.File.ReadAllTextAsync(appSettingsPath);
            using var jsonDoc = JsonDocument.Parse(jsonString);
            
            var options = new JsonWriterOptions { Indented = true };
            using var stream = new MemoryStream();
            using (var writer = new Utf8JsonWriter(stream, options))
            {
                writer.WriteStartObject();
                
                foreach (var property in jsonDoc.RootElement.EnumerateObject())
                {
                    if (property.Name == "FirmSettings")
                    {
                        writer.WritePropertyName("FirmSettings");
                        writer.WriteStartObject();
                        writer.WriteString("NazwaFirmy", settings.NazwaFirmy);
                        writer.WriteString("Adres", settings.Adres);
                        writer.WriteString("NIP", settings.NIP);
                        writer.WriteString("Telefon", settings.Telefon);
                        writer.WriteString("Bank", settings.Bank);
                        writer.WriteString("NumerKonta", settings.NumerKonta);
                        writer.WriteString("MiejsceWystawienia", settings.MiejsceWystawienia);
                        writer.WriteString("EmailKsiegowosci", settings.EmailKsiegowosci);
                        writer.WriteEndObject();
                    }
                    else
                    {
                        property.WriteTo(writer);
                    }
                }
                
                writer.WriteEndObject();
            }
            
            var newJsonString = System.Text.Encoding.UTF8.GetString(stream.ToArray());
            await System.IO.File.WriteAllTextAsync(appSettingsPath, newJsonString);
            
            // Zwróć zapisane dane zamiast tylko komunikatu
            return Ok(settings);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Błąd podczas zapisywania ustawień: {ex.Message}" });
        }
    }
}

public record CreateUserDto(string Email, string Password, string? UserName, string? Role);
public record UpdateUserDto(string Email, string? UserName, string? Role);
public record ResetPasswordDto(string NewPassword);

public class FirmSettingsDto
{
    public string NazwaFirmy { get; set; } = "";
    public string Adres { get; set; } = "";
    public string NIP { get; set; } = "";
    public string Telefon { get; set; } = "";
    public string Bank { get; set; } = "";
    public string NumerKonta { get; set; } = "";
    public string MiejsceWystawienia { get; set; } = "";
    public string EmailKsiegowosci { get; set; } = "";
}
