using System;

namespace BiuroTurystyczne1.Data.Models;

public class FirmSettings
{
    public int Id { get; set; }
    public string NazwaFirmy { get; set; } = "";
    public string Adres { get; set; } = "";
    public string NIP { get; set; } = "";
    public string Telefon { get; set; } = "";
    public string Bank { get; set; } = "";
    public string NumerKonta { get; set; } = "";
    public string MiejsceWystawienia { get; set; } = "";
    public string EmailKsiegowosci { get; set; } = "";
}