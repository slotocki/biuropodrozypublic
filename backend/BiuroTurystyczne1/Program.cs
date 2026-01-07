using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using BiuroTurystyczne1.Data;
using BiuroTurystyczne1.Data.Models;
using QuestPDF.Infrastructure;
using BiuroTurystyczne1.Infrastructure.Converters;
using BiuroTurystyczne1.Infrastructure.Email;
using BiuroTurystyczne1.Services;

var builder = WebApplication.CreateBuilder(args);

// --- Konfiguracja Serwisów ---

QuestPDF.Settings.License = LicenseType.Community;

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
                       ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

// Rejestracja OBU kontekstów
builder.Services.AddDbContext<BiuroDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));
    
builder.Services.AddDbContext<IdenQtityDQataContQext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));

// Konfiguracja Identity z rolami
builder.Services.AddAuthentication();
builder.Services.AddAuthorization();

builder.Services.AddIdentityApiEndpoints<IdentityUser>(options =>
{
    // Pozwól na spacje i inne znaki w UserName (imię i nazwisko)
    options.User.AllowedUserNameCharacters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._@+ ąćęłńóśźżĄĆĘŁŃÓŚŹŻ";
})
    .AddRoles<IdentityRole>()
    .AddEntityFrameworkStores<IdenQtityDQataContQext>();

builder.Services.AddScoped<IPdfService, PdfService>();
builder.Services.AddScoped<IFirmSettingsService, FirmSettingsService>();

// Konfiguracja CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.Converters.Add(new DateOnlyJsonConverter());
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddHttpClient();
builder.Services.AddScoped<IAddressValidationService, AddressValidationService>();

builder.Services.Configure<EmailSettings>(builder.Configuration.GetSection("EmailSettings"));
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IKlienciImportService, KlienciImportService>();
builder.Services.AddScoped<OfertaService>();

// --- Budowanie Aplikacji ---
var app = builder.Build();

// --- Inicjalizacja Admina ---
using (var scope = app.Services.CreateScope())
{
    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<IdentityUser>>();
    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    
    try
    {
        // Utwórz rolę Admin jeśli nie istnieje
        if (!await roleManager.RoleExistsAsync("Admin"))
        {
            await roleManager.CreateAsync(new IdentityRole("Admin"));
            logger.LogInformation("Utworzono rolę Admin");
        }
        
        // Pobierz dane admina z konfiguracji
        var adminEmail = builder.Configuration["Admin:Email"] ?? "admin@biuro.pl";
        var adminPassword = builder.Configuration["Admin:Password"] ?? "Sara1234#";
        
        // Sprawdź czy admin istnieje
        var admin = await userManager.FindByEmailAsync(adminEmail);
        
        if (admin == null)
        {
            admin = new IdentityUser
            {
                UserName = adminEmail,
                Email = adminEmail,
                EmailConfirmed = true
            };
            
            var result = await userManager.CreateAsync(admin, adminPassword);
            
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(admin, "Admin");
                logger.LogWarning("Utworzono użytkownika admin: {Email}", adminEmail);
            }
            else
            {
                logger.LogError("Błąd tworzenia admina: {Errors}", string.Join(", ", result.Errors.Select(e => e.Description)));
            }
        }
        else
        {
            // Reset hasła admina na to z konfiguracji
            var token = await userManager.GeneratePasswordResetTokenAsync(admin);
            await userManager.ResetPasswordAsync(admin, token, adminPassword);
            logger.LogInformation("Użytkownik admin już istnieje, hasło zresetowane");
        }
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Błąd podczas inicjalizacji admina");
    }
}

// --- Konfiguracja Pipeline (Middleware) ---

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseStaticFiles(); 
app.UseRouting(); 
app.UseCors("AllowReactApp"); 
app.UseAuthentication();
app.UseAuthorization();

// Mapowanie endpointów Identity
app.MapIdentityApi<IdentityUser>();

// ✅ Zablokuj endpoint rejestracji
app.MapPost("/register", () => Results.Json(
    new { message = "Rejestracja jest wyłączona. Skontaktuj się z administratorem." }, 
    statusCode: 403
)).AllowAnonymous();

app.MapControllers();

app.Run();
