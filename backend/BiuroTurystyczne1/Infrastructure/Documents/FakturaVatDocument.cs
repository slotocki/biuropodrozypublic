using System;
using System.IO;
using BiuroTurystyczne1.Data.Models;
using Humanizer;
using QuestPDF.Drawing;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System.Globalization;

namespace BiuroTurystyczne1.Infrastructure.Documents;

public class FakturaVatDocument : IDocument
{
    private readonly FakturaVat _faktura;
    private readonly Uzytkownik _wystawiajacy;
    
    private static readonly string CalibriRegularPath = Path.Combine("Resources", "calibri.ttf");
    private static readonly string CalibriBoldPath = Path.Combine("Resources", "calibrib.ttf");
    
    static FakturaVatDocument()
    {
        FontManager.RegisterFont(File.OpenRead(CalibriRegularPath));
        FontManager.RegisterFont(File.OpenRead(CalibriBoldPath));
    }

    public FakturaVatDocument(FakturaVat faktura, Uzytkownik wystawiajacy)
    {
        _faktura = faktura;
        _wystawiajacy = wystawiajacy;
    }

    public DocumentMetadata GetMetadata() => DocumentMetadata.Default;
    
    public void Compose(IDocumentContainer container)
    {
        container
            .Page(page => ComposePage(page, "ORYGINAŁ"))
            .Page(page => ComposePage(page, "KOPIA"));
    }
    
    private void ComposePage(PageDescriptor page, string versionLabel)
    {
        page.Margin(40);
        page.DefaultTextStyle(x => x.FontFamily("Calibri").FontSize(10));
        page.Header().Element(headerContainer => ComposeHeader(headerContainer, versionLabel));
        page.Content().Element(ComposeContent);
        page.Footer().Element(ComposeFooter);
    }

    private void ComposeHeader(IContainer container, string versionLabel)
    {
        container.Row(row =>
        {
            var logoPath = Path.Combine("Resources", "logo.png");
            if (File.Exists(logoPath))
                row.ConstantItem(1.7f * 72).Image(logoPath);

            row.RelativeItem().PaddingLeft(20).Column(column =>
            {
                column.Item().AlignRight().Text("FAKTURA VAT").Bold().FontSize(20).FontColor(Colors.Grey.Medium);
                column.Item().AlignRight().Text(versionLabel).Bold().FontSize(12).FontColor(Colors.Grey.Medium);
                column.Item().AlignRight().Text(text =>
                {
                    text.Span("NR: ").SemiBold();
                    text.Span(_faktura.NumerFaktury);
                });
                column.Item().AlignRight().Text(text =>
                {
                    text.Span("DATA WYSTAWIENIA: ").SemiBold();
                    text.Span($"{_faktura.DataWystawienia:dd.MM.yyyy}");
                });
                column.Item().AlignRight().Text(text =>
                {
                    text.Span("MIEJSCE WYSTAWIENIA: ").SemiBold();
                    text.Span("KRAKÓW");
                });
            });
        });
    }

    private void ComposeContent(IContainer container)
    {
        container.PaddingVertical(20).Column(column =>
        {
            column.Spacing(30);
            
            column.Item().Row(row =>
            {
                row.RelativeItem(5.5f).Column(col =>
                {
                    col.Item().Text("SPRZEDAWCA:").SemiBold();
                    col.Item().Text("NAUCZYCIELSKIE BIURO TURYSTYCZNE \"BELFEREK\" EWA KUSTRA");
                    col.Item().Text("al. Juliusza Słowackiego 52, 30-018 Kraków");
                    col.Item().Text("NIP: 677 129 04 82");
                    col.Item().Text("TELEFON: +48 575 550 302");
                });
                
                row.RelativeItem(4.5f).AlignRight().Column(col =>
                {
                    col.Item().Text("NABYWCA:").SemiBold();
                    col.Item().Text(_faktura.IdKontrahentNavigation.NazwaFirmy);
                    col.Item().Text($"NIP: {_faktura.IdKontrahentNavigation.Nip}");
                    col.Item().Text($"ADRES: {_faktura.IdKontrahentNavigation.Ulica}");
                    col.Item().Text($"{_faktura.IdKontrahentNavigation.KodPocztowy} {_faktura.IdKontrahentNavigation.Miejscowosc}");
                });
            });
            
            column.Item().Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.ConstantColumn(140);
                    columns.ConstantColumn(140);
                    columns.RelativeColumn();
                });
                
                table.Header(header =>
                {
                    header.Cell().Border(0.5f).BorderColor(Colors.Grey.Medium).Background(Colors.Grey.Lighten3).AlignCenter().Text("Sposób zapłaty");
                    header.Cell().Border(0.5f).BorderColor(Colors.Grey.Medium).Background(Colors.Grey.Lighten3).AlignCenter().Text("Termin zapłaty");
                    header.Cell().Border(0.5f).BorderColor(Colors.Grey.Medium).Background(Colors.Grey.Lighten3).AlignCenter().Text("BANK: SANTANDER BANK POLSKA S.A");
                });
                
                table.Cell().Border(0.5f).BorderColor(Colors.Grey.Medium).AlignCenter().Text(_faktura.FormaPlatnosci);
                table.Cell().Border(0.5f).BorderColor(Colors.Grey.Medium).AlignCenter().Text($"{_faktura.TerminPlatnosci:dd.MM.yyyy}");
                table.Cell().Border(0.5f).BorderColor(Colors.Grey.Medium).AlignCenter().Text("KONTO: 24 1090 2053 0000 0001 1444 5232").Bold();
            });

            column.Item().Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.ConstantColumn(20); 
                    columns.RelativeColumn(3); 
                    columns.ConstantColumn(40);
                    columns.ConstantColumn(50); 
                    columns.ConstantColumn(50); 
                    columns.ConstantColumn(50);
                    columns.ConstantColumn(50); 
                    columns.ConstantColumn(50);
                });
                
                table.Header(header =>
                {
                    header.Cell().Background(Colors.Grey.Lighten3).AlignCenter().PaddingVertical(2).Text("LP").FontSize(8);
                    header.Cell().Background(Colors.Grey.Lighten3).AlignCenter().PaddingVertical(2).Text("NAZWA USŁUGI").FontSize(8);
                    header.Cell().Background(Colors.Grey.Lighten3).AlignCenter().PaddingVertical(2).Text("ILOŚĆ").FontSize(8);
                    header.Cell().Background(Colors.Grey.Lighten3).AlignCenter().PaddingVertical(2).Text("CENA\nBRUTTO ZŁ").FontSize(8);
                    header.Cell().Background(Colors.Grey.Lighten3).AlignCenter().PaddingVertical(2).Text("WARTOŚĆ\nNETTO ZŁ").FontSize(8);
                    header.Cell().Background(Colors.Grey.Lighten3).AlignCenter().PaddingVertical(2).Text("STAWKA\nVAT").FontSize(8);
                    header.Cell().Background(Colors.Grey.Lighten3).AlignCenter().PaddingVertical(2).Text("KWOTA\nVAT").FontSize(8);
                    header.Cell().Background(Colors.Grey.Lighten3).AlignCenter().PaddingVertical(2).Text("WARTOŚĆ\nBRUTTO ZŁ").FontSize(8);
                });
                
                // Pozycje faktury
                var index = 1;
                foreach (var pozycja in _faktura.FakturaVatPozycjas)
                {
                    var wartoscNetto = pozycja.CenaNetto * pozycja.Ilosc;
                    var kwotaVat = wartoscNetto * (pozycja.StawkaVat / 100);
                    var wartoscBrutto = wartoscNetto + kwotaVat;
                    
                    table.Cell().Border(0.5f).BorderColor(Colors.Grey.Medium).AlignCenter().Text((index++).ToString());
                    table.Cell().Border(0.5f).BorderColor(Colors.Grey.Medium).PaddingLeft(4).AlignLeft().Text(pozycja.IdUslugaNavigation.NazwaUslugi);
                    table.Cell().Border(0.5f).BorderColor(Colors.Grey.Medium).AlignCenter().Text(pozycja.Ilosc.ToString("N0"));
                    table.Cell().Border(0.5f).BorderColor(Colors.Grey.Medium).AlignCenter().Text(wartoscBrutto.ToString("N2"));
                    table.Cell().Border(0.5f).BorderColor(Colors.Grey.Medium).AlignCenter().Text(wartoscNetto.ToString("N2"));
                    table.Cell().Border(0.5f).BorderColor(Colors.Grey.Medium).AlignCenter().Text($"{pozycja.StawkaVat:N0}%");
                    table.Cell().Border(0.5f).BorderColor(Colors.Grey.Medium).AlignCenter().Text(kwotaVat.ToString("N2"));
                    table.Cell().Border(0.5f).BorderColor(Colors.Grey.Medium).AlignCenter().Text(wartoscBrutto.ToString("N2"));
                }
                
                // RAZEM końcowe (bez podsumowań per stawka VAT)
                table.Cell().ColumnSpan(4).Border(0.5f).BorderColor(Colors.Grey.Medium)
                    .Background(Colors.Grey.Lighten3)
                    .AlignRight().PaddingRight(4)
                    .Text("RAZEM:").Bold();
                
                table.Cell().Border(0.5f).BorderColor(Colors.Grey.Medium)
                    .Background(Colors.Grey.Lighten3)
                    .AlignCenter()
                    .Text($"{_faktura.KwotaNetto:N2}").Bold();
                
                table.Cell().Border(0.5f).BorderColor(Colors.Grey.Medium)
                    .Background(Colors.Grey.Lighten3)
                    .AlignCenter()
                    .Text(""); // Puste pole
                
                table.Cell().Border(0.5f).BorderColor(Colors.Grey.Medium)
                    .Background(Colors.Grey.Lighten3)
                    .AlignCenter()
                    .Text($"{_faktura.KwotaVat:N2}").Bold();
                
                table.Cell().Border(0.5f).BorderColor(Colors.Grey.Medium)
                    .Background(Colors.Grey.Lighten3)
                    .AlignCenter()
                    .Text($"{_faktura.KwotaBrutto:N2}").Bold();
            });
            
            column.Item().PaddingTop(20).Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.ConstantColumn(200);
                    columns.RelativeColumn();
                });
                
                table.Cell().Border(0.5f).BorderColor(Colors.Grey.Medium).Padding(8).Text($"Razem: {_faktura.KwotaBrutto:N2} ZŁ").FontSize(14);
                table.Cell().Border(0.5f).BorderColor(Colors.Grey.Medium).Padding(8).AlignRight().Text($"Pozostało do zapłaty: {(_faktura.KwotaBrutto - _faktura.Zaplacono):N2} ZŁ").Bold().FontSize(14);
                
                var kwotaSlownie = KwotaSlownie(_faktura.KwotaBrutto);
                
                table.Cell().ColumnSpan(2).Border(0.5f).BorderColor(Colors.Grey.Medium).Padding(8).Text($"Słownie: {kwotaSlownie}").FontSize(12);
            });
        });
    }

    private void ComposeFooter(IContainer container)
    {
        container.Row(row =>
        {
            row.RelativeItem().Column(col =>
            {
                col.Item().LineHorizontal(1.5f);
                col.Item().AlignCenter().Text("Czytelny podpis osoby upoważnionej do odbioru faktury").FontSize(8);
            });
            
            row.RelativeItem(0.5f);
            
            row.RelativeItem().Column(col =>
            {
                col.Item().AlignCenter().Text(_wystawiajacy.Login).FontSize(12);
                col.Item().LineHorizontal(1.5f);
                col.Item().AlignCenter().Text("Czytelny podpis osoby upoważnionej do wystawienia faktury").FontSize(8);
            });
        });
    }

    // Prawidłowa odmiana polskich groszy
    private static string GetPolishPlural(int number, string singular, string plural2_4, string plural5)
    {
        // Obsługa wyjątków dla liczb 11-14
        if (number % 100 >= 11 && number % 100 <= 14)
        {
            return plural5;
        }

        // Sprawdź ostatnią cyfrę
        int lastDigit = number % 10;

        if (lastDigit == 1)
        {
            return singular;
        }
        else if (lastDigit >= 2 && lastDigit <= 4)
        {
            return plural2_4;
        }
        else
        {
            return plural5;
        }
    }

    // Konwersja kwoty na słowa z prawidłową odmianą
    private static string KwotaSlownie(decimal kwota)
    {
        var culture = new CultureInfo("pl");
        
        int zlote = (int)kwota;
        int grosze = (int)Math.Round((kwota - zlote) * 100);

        string result = "";

        // Złote
        if (zlote == 0)
        {
            result = "zero złotych";
        }
        else
        {
            string zloteWords = zlote.ToWords(culture);
            string zloteForm = GetPolishPlural(zlote, "złoty", "złote", "złotych");
            result = $"{zloteWords} {zloteForm}";
        }

        // Grosze
        if (grosze > 0)
        {
            string groszeWords = grosze.ToWords(culture);
            string groszeForm = GetPolishPlural(grosze, "grosz", "grosze", "groszy");
            result += $" {groszeWords} {groszeForm}";
        }

        return result;
    }
}
