using System.Text.Json;
using System.Text.Json.Serialization;

namespace BiuroTurystyczne1.Services
{
    public interface IAddressValidationService
    {
        Task<PostalCodeLookupResult> GetLocationByPostalCodeAsync(string kodPocztowy);
    }

    public class PostalCodeLookupResult
    {
        public bool Success { get; set; }
        public string? Miejscowosc { get; set; }
        public string? Ulica { get; set; }
        public string? Gmina { get; set; }
        public string? Powiat { get; set; }
        public string? Message { get; set; }
        public List<LocationOption>? Locations { get; set; }
    }

    public class LocationOption
    {
        public string Miejscowosc { get; set; } = "";
        public string? Ulica { get; set; }
        public string? Gmina { get; set; }
        public string? Powiat { get; set; }
    }

    public class AddressValidationService : IAddressValidationService
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ILogger<AddressValidationService> _logger;

        public AddressValidationService(IHttpClientFactory httpClientFactory, ILogger<AddressValidationService> logger)
        {
            _httpClientFactory = httpClientFactory;
            _logger = logger;
        }

        public async Task<PostalCodeLookupResult> GetLocationByPostalCodeAsync(string kodPocztowy)
        {
            var result = new PostalCodeLookupResult { Locations = new List<LocationOption>() };

            // Walidacja formatu kodu pocztowego (XX-XXX)
            if (string.IsNullOrWhiteSpace(kodPocztowy))
            {
                result.Success = false;
                result.Message = "Kod pocztowy jest wymagany.";
                return result;
            }

            // Usuń myślnik jeśli istnieje
            var cleanCode = kodPocztowy.Replace("-", "").Trim();

            // Sprawdź czy kod ma 5 cyfr
            if (cleanCode.Length != 5 || !cleanCode.All(char.IsDigit))
            {
                result.Success = false;
                result.Message = "Kod pocztowy musi mieć format XX-XXX.";
                return result;
            }

            // Dodaj myślnik w odpowiednim miejscu
            var formattedCode = $"{cleanCode.Substring(0, 2)}-{cleanCode.Substring(2)}";

            try
            {
                var client = _httpClientFactory.CreateClient();
                client.Timeout = TimeSpan.FromSeconds(5);
                client.DefaultRequestHeaders.Add("Accept", "application/json");

                var url = $"https://kodpocztowy.intami.pl/api/{formattedCode}";
                _logger.LogInformation("Wysyłam zapytanie do API kodów pocztowych: {Url}", url);

                var response = await client.GetAsync(url);

                if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
                {
                    result.Success = false;
                    result.Message = $"Nie znaleziono kodu pocztowego {formattedCode}.";
                    return result;
                }

                if (!response.IsSuccessStatusCode)
                {
                    result.Success = false;
                    result.Message = "Błąd podczas pobierania danych z API kodów pocztowych.";
                    return result;
                }

                var content = await response.Content.ReadAsStringAsync();

                if (string.IsNullOrWhiteSpace(content) || content == "[]")
                {
                    result.Success = false;
                    result.Message = $"Brak danych dla kodu pocztowego {formattedCode}.";
                    return result;
                }

             
                using var document = JsonDocument.Parse(content);
                var root = document.RootElement;

                if (root.ValueKind != JsonValueKind.Array || root.GetArrayLength() == 0)
                {
                    result.Success = false;
                    result.Message = $"Brak danych dla kodu pocztowego {formattedCode}.";
                    return result;
                }

                // Przetwórz każdy element tablicy
                foreach (var element in root.EnumerateArray())
                {
                    var miejscowosc = element.TryGetProperty("miejscowosc", out var miejscowoscProp) 
                        ? miejscowoscProp.GetString() 
                        : null;

                    var ulica = element.TryGetProperty("ulica", out var ulicaProp) 
                        ? ulicaProp.GetString() 
                        : null;

                    var gmina = element.TryGetProperty("gmina", out var gminaProp) 
                        ? gminaProp.GetString() 
                        : null;

                    var powiat = element.TryGetProperty("powiat", out var powiatProp) 
                        ? powiatProp.GetString() 
                        : null;

                    if (!string.IsNullOrEmpty(miejscowosc))
                    {
                        result.Locations.Add(new LocationOption
                        {
                            Miejscowosc = miejscowosc,
                            Ulica = ulica,
                            Gmina = gmina,
                            Powiat = powiat
                        });
                    }
                }

                if (result.Locations.Count == 0)
                {
                    result.Success = false;
                    result.Message = $"Brak danych dla kodu pocztowego {formattedCode}.";
                    return result;
                }

                // Ustaw domyślną miejscowość (pierwsza z listy)
                var firstLocation = result.Locations.First();
                result.Miejscowosc = firstLocation.Miejscowosc;
                result.Ulica = firstLocation.Ulica;
                result.Gmina = firstLocation.Gmina;
                result.Powiat = firstLocation.Powiat;

                result.Success = true;
                result.Message = result.Locations.Count > 1 
                    ? $"Znaleziono {result.Locations.Count} miejscowości dla kodu {formattedCode}." 
                    : "Kod pocztowy został zweryfikowany.";

                _logger.LogInformation("Pomyślnie pobrano dane dla kodu pocztowego: {Code}", formattedCode);
                return result;
            }
            catch (TaskCanceledException)
            {
                _logger.LogWarning("Timeout podczas pobierania danych dla kodu pocztowego: {Code}", formattedCode);
                result.Success = false;
                result.Message = "Przekroczono limit czasu oczekiwania na odpowiedź API.";
                return result;
            }
            catch (JsonException ex)
            {
                _logger.LogError(ex, "Błąd parsowania JSON dla kodu pocztowego: {Code}", formattedCode);
                result.Success = false;
                result.Message = "Błąd podczas przetwarzania odpowiedzi z API.";
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Błąd podczas pobierania danych dla kodu pocztowego: {Code}", formattedCode);
                result.Success = false;
                result.Message = "Wystąpił nieoczekiwany błąd podczas pobierania danych.";
                return result;
            }
        }
    }
}
