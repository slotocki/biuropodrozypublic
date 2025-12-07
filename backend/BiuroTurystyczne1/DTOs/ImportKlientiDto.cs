namespace BiuroTurystyczne1.DTOs;

public class ImportKlientiDto
{
    public List<ImportKlientItemDto> Clients { get; set; } = new();
}

public class ImportKlientItemDto
{
    public string Imie { get; set; } = "";
    public string Nazwisko { get; set; } = "";
    public string Ulica { get; set; } = "";
    public string KodPocztowy { get; set; } = "";
    public string Miejscowosc { get; set; } = "";
    public string Email { get; set; } = "";
    public string Telefon { get; set; } = "";
    public int? IdObywatelstwo { get; set; }
    public DateTime? DataUrodzenia { get; set; }
    public int? IdGrupa { get; set; }
}

public class ImportResultDto
{
    public int Imported { get; set; }
    public List<ImportErrorDto> Errors { get; set; } = new();
    public int Total { get; set; }
    public bool Success { get; set; }
}

public class ImportErrorDto
{
    public string Client { get; set; } = "";
    public string Error { get; set; } = "";
}