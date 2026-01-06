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

public class FakturaKorygujacaDocument : IDocument
{
    private readonly FakturaVat _korekta;
    private readonly FakturaVat _oryginalnaFaktura;
    private readonly Uzytkownik _wystawiajacy;
    private readonly FirmSettings _firmSettings;
    
    private static readonly string CalibriRegularPath = Path.Combine("Resources", "calibri.ttf");
    private static readonly string CalibriBoldPath = Path.Combine("Resources", "calibrib.ttf");
    
    static FakturaKorygujacaDocument()
    {
        FontManager.RegisterFont(File.OpenRead(CalibriRegularPath));
        FontManager.RegisterFont(File.OpenRead(CalibriBoldPath));
    }

    public FakturaKorygujacaDocument(FakturaVat korekta, FakturaVat oryginalnaFaktura, Uzytkownik wystawiajacy, FirmSettings? firmSettings = null)
    {
        _korekta = korekta;
        _oryginalnaFaktura = oryginalnaFaktura;
        _wystawiajacy = wystawiajacy;
        _firmSettings = firmSettings ?? new FirmSettings();
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
            var logoPath = !string.IsNullOrEmpty(_firmSettings.LogoPath) 
                ? _firmSettings.LogoPath 
                : Path.Combine("Resources", "logo.png");
            if (File.Exists(logoPath))
                row.ConstantItem(1.7f * 72).Image(logoPath);

            row.RelativeItem().PaddingLeft(20).Column(column =>
            {
                column.Item().AlignRight().Text("FAKTURA KORYGUJĄCA").Bold().FontSize(18).FontColor(Colors.Red.Medium);
                column.Item().AlignRight().Text(versionLabel).Bold().FontSize(12).FontColor(Colors.Grey.Medium);
                column.Item().AlignRight().Text(text =>
                {
                    text.Span("NR KOREKTY: ").SemiBold();
                    text.Span(_korekta.NumerFaktury);
                });
                column.Item().AlignRight().Text(text =>
                {
                    text.Span("DO FAKTURY: ").SemiBold();
                    text.Span(_oryginalnaFaktura.NumerFaktury);
                });
                column.Item().AlignRight().Text(text =>
                {
                    text.Span("DATA WYSTAWIENIA: ").SemiBold();
                    text.Span($"{_korekta.DataWystawienia:dd.MM.yyyy}");
                });
                column.Item().AlignRight().Text(text =>
                {
                    text.Span("MIEJSCE WYSTAWIENIA: ").SemiBold();
                    text.Span(_firmSettings.MiejsceWystawienia);
                });
            });
        });
    }

    private void ComposeContent(IContainer container)
    {
        container.PaddingVertical(20).Column(column =>
        {
            column.Spacing(20);
            
            // Powód korekty
            column.Item().Background(Colors.Yellow.Lighten4).Padding(10).Column(col =>
            {
                col.Item().Text("POWÓD KOREKTY:").Bold().FontSize(11);
                col.Item().Text(_korekta.PowodKorekty ?? "Nie podano").FontSize(10);
            });
            
            column.Item().Row(row =>
            {
                row.RelativeItem(5.5f).Column(col =>
                {
                    col.Item().Text("SPRZEDAWCA:").SemiBold();
                    col.Item().Text(_firmSettings.NazwaFirmy);
                    col.Item().Text(_firmSettings.Adres);
                    col.Item().Text($"NIP: {_firmSettings.NIP}");
                    col.Item().Text($"TELEFON: {_firmSettings.Telefon}");
                });
                
                row.RelativeItem(4.5f).AlignRight().Column(col =>
                {
                    col.Item().Text("NABYWCA:").SemiBold();
                    col.Item().Text(_korekta.IdKontrahentNavigation.NazwaFirmy);
                    col.Item().Text($"NIP: {_korekta.IdKontrahentNavigation.Nip}");
                    col.Item().Text($"ADRES: {_korekta.IdKontrahentNavigation.Ulica}");
                    col.Item().Text($"{_korekta.IdKontrahentNavigation.KodPocztowy} {_korekta.IdKontrahentNavigation.Miejscowosc}");
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
                    header.Cell().Border(0.5f).BorderColor(Colors.Grey.Medium).Background(Colors.Grey.Lighten3).AlignCenter().Text($"BANK: {_firmSettings.Bank}");
                });
                
                table.Cell().Border(0.5f).BorderColor(Colors.Grey.Medium).AlignCenter().Text(_korekta.FormaPlatnosci);
                table.Cell().Border(0.5f).BorderColor(Colors.Grey.Medium).AlignCenter().Text($"{_korekta.TerminPlatnosci:dd.MM.yyyy}");
                table.Cell().Border(0.5f).BorderColor(Colors.Grey.Medium).AlignCenter().Text($"KONTO: {_firmSettings.NumerKonta}").Bold();
            });

            // Tabela pozycji korygujących
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
                
                // Pozycje korekty - mogą mieć wartości ujemne
                var index = 1;
                foreach (var pozycja in _korekta.FakturaVatPozycjas)
                {
                    var wartoscNetto = pozycja.CenaNetto * pozycja.Ilosc;
                    var kwotaVat = wartoscNetto * (pozycja.StawkaVat / 100);
                    var wartoscBrutto = wartoscNetto + kwotaVat;
                    
                    // Podświetl ujemne wartości na czerwono
                    var textColor = wartoscBrutto < 0 ? Colors.Red.Medium : Colors.Black;
                    
                    table.Cell().Border(0.5f).BorderColor(Colors.Grey.Medium).AlignCenter().Text((index++).ToString());
                    table.Cell().Border(0.5f).BorderColor(Colors.Grey.Medium).PaddingLeft(4).AlignLeft().Text(pozycja.IdUslugaNavigation.NazwaUslugi);
                    table.Cell().Border(0.5f).BorderColor(Colors.Grey.Medium).AlignCenter().Text(pozycja.Ilosc.ToString("N2")).FontColor(textColor);
                    table.Cell().Border(0.5f).BorderColor(Colors.Grey.Medium).AlignCenter().Text((wartoscBrutto / pozycja.Ilosc).ToString("N2")).FontColor(textColor);
                    table.Cell().Border(0.5f).BorderColor(Colors.Grey.Medium).AlignCenter().Text(wartoscNetto.ToString("N2")).FontColor(textColor);
                    table.Cell().Border(0.5f).BorderColor(Colors.Grey.Medium).AlignCenter().Text($"{pozycja.StawkaVat:N0}%");
                    table.Cell().Border(0.5f).BorderColor(Colors.Grey.Medium).AlignCenter().Text(kwotaVat.ToString("N2")).FontColor(textColor);
                    table.Cell().Border(0.5f).BorderColor(Colors.Grey.Medium).AlignCenter().Text(wartoscBrutto.ToString("N2")).FontColor(textColor);
                }
                
                // RAZEM końcowe
                var razemColor = _korekta.KwotaBrutto < 0 ? Colors.Red.Medium : Colors.Black;
                
                table.Cell().ColumnSpan(4).Border(0.5f).BorderColor(Colors.Grey.Medium)
                    .Background(Colors.Grey.Lighten3)
                    .AlignRight().PaddingRight(4)
                    .Text("RAZEM:").Bold();
                
                table.Cell().Border(0.5f).BorderColor(Colors.Grey.Medium)
                    .Background(Colors.Grey.Lighten3)
                    .AlignCenter()
                    .Text($"{_korekta.KwotaNetto:N2}").Bold().FontColor(razemColor);
                
                table.Cell().Border(0.5f).BorderColor(Colors.Grey.Medium)
                    .Background(Colors.Grey.Lighten3)
                    .AlignCenter()
                    .Text("");
                
                table.Cell().Border(0.5f).BorderColor(Colors.Grey.Medium)
                    .Background(Colors.Grey.Lighten3)
                    .AlignCenter()
                    .Text($"{_korekta.KwotaVat:N2}").Bold().FontColor(razemColor);
                
                table.Cell().Border(0.5f).BorderColor(Colors.Grey.Medium)
                    .Background(Colors.Grey.Lighten3)
                    .AlignCenter()
                    .Text($"{_korekta.KwotaBrutto:N2}").Bold().FontColor(razemColor);
            });
            
            // Podsumowanie korekty
            column.Item().PaddingTop(20).Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.ConstantColumn(200);
                    columns.RelativeColumn();
                });
                
                var kwotaKorekty = _korekta.KwotaBrutto;
                var czyDoZwrotu = kwotaKorekty < 0;
                var etykieta = czyDoZwrotu ? "DO ZWROTU:" : "DO DOPŁATY:";
                var kwotaColor = czyDoZwrotu ? Colors.Red.Medium : Colors.Green.Medium;
                
                table.Cell().Border(0.5f).BorderColor(Colors.Grey.Medium).Padding(8).Text($"Razem korekta: {kwotaKorekty:N2} ZŁ").FontSize(14).FontColor(kwotaColor);
                table.Cell().Border(0.5f).BorderColor(Colors.Grey.Medium).Padding(8).AlignRight().Text($"{etykieta} {Math.Abs(kwotaKorekty):N2} ZŁ").Bold().FontSize(14).FontColor(kwotaColor);
                
                var kwotaSlownie = KwotaSlownie(Math.Abs(kwotaKorekty));
                
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

    private static string GetPolishPlural(int number, string singular, string plural2_4, string plural5)
    {
        if (number % 100 >= 11 && number % 100 <= 14)
        {
            return plural5;
        }

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

    private static string KwotaSlownie(decimal kwota)
    {
        var culture = new CultureInfo("pl");
        
        int zlote = (int)kwota;
        int grosze = (int)Math.Round((kwota - zlote) * 100);

        string result = "";

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

        if (grosze > 0)
        {
            string groszeWords = grosze.ToWords(culture);
            string groszeForm = GetPolishPlural(grosze, "grosz", "grosze", "groszy");
            result += $" {groszeWords} {groszeForm}";
        }

        return result;
    }
}

