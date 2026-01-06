using System.Globalization;
using BiuroTurystyczne1.Data.Models;
using QuestPDF.Drawing;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace BiuroTurystyczne1.Infrastructure.Documents;

public class RaportMiesiecznyDocument : IDocument
{
    private readonly List<FakturaVat> _faktury;
    private readonly int _rok;
    private readonly int _miesiac;
    private readonly FirmSettings _firmSettings;

    private static readonly string CalibriRegularPath = Path.Combine("Resources", "calibri.ttf");
    private static readonly string CalibriBoldPath = Path.Combine("Resources", "calibrib.ttf");

    static RaportMiesiecznyDocument()
    {
        FontManager.RegisterFont(File.OpenRead(CalibriRegularPath));
        FontManager.RegisterFont(File.OpenRead(CalibriBoldPath));
    }

    public RaportMiesiecznyDocument(List<FakturaVat> faktury, int rok, int miesiac, FirmSettings firmSettings)
    {
        _faktury = faktury;
        _rok = rok;
        _miesiac = miesiac;
        _firmSettings = firmSettings;
    }

    public DocumentMetadata GetMetadata() => DocumentMetadata.Default;

    public void Compose(IDocumentContainer container)
    {
        container.Page(page =>
        {
            page.Margin(40);
            page.DefaultTextStyle(x => x.FontFamily("Calibri").FontSize(9));
            page.Header().Element(ComposeHeader);
            page.Content().Element(ComposeContent);
            page.Footer().Element(ComposeFooter);
        });
    }

    private void ComposeHeader(IContainer container)
    {
        container.Row(row =>
        {
            var logoPath = !string.IsNullOrEmpty(_firmSettings.LogoPath)
                ? _firmSettings.LogoPath
                : Path.Combine("Resources", "logo.png");
            if (File.Exists(logoPath))
                row.ConstantItem(1.5f * 72).Image(logoPath);

            row.RelativeItem().PaddingLeft(20).Column(column =>
            {
                column.Item().AlignRight().Text("RAPORT MIESIĘCZNY").Bold().FontSize(18).FontColor(Colors.Blue.Medium);
                column.Item().AlignRight().Text($"{GetNazwaMiesiaca(_miesiac)} {_rok}").Bold().FontSize(14).FontColor(Colors.Grey.Darken1);
                column.Item().AlignRight().Text($"Data wygenerowania: {DateTime.Now:dd.MM.yyyy HH:mm}").FontSize(9).FontColor(Colors.Grey.Medium);
            });
        });
    }

    private void ComposeContent(IContainer container)
    {
        var fakturyPierwotne = _faktury.Where(f => (f.TypDokumentu ?? "FAKTURA") == "FAKTURA").ToList();
        var korekty = _faktury.Where(f => f.TypDokumentu == "KOREKTA").ToList();
        var sumaNetto = _faktury.Sum(f => f.KwotaNetto);
        var sumaVat = _faktury.Sum(f => f.KwotaVat);
        var sumaBrutto = _faktury.Sum(f => f.KwotaBrutto);

        // VAT z rozbiciem na stawki
        var vatWgStawek = new Dictionary<decimal, decimal>();
        foreach (var faktura in _faktury)
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

        container.PaddingVertical(15).Column(column =>
        {
            column.Spacing(15);

            // Podsumowanie
            column.Item().Text("PODSUMOWANIE OKRESU").Bold().FontSize(12);
            
            column.Item().Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.RelativeColumn();
                    columns.ConstantColumn(100);
                    columns.RelativeColumn();
                    columns.ConstantColumn(100);
                });

                table.Cell().Border(0.5f).BorderColor(Colors.Grey.Medium).Background(Colors.Grey.Lighten4).Padding(6).Text("Liczba faktur:").SemiBold();
                table.Cell().Border(0.5f).BorderColor(Colors.Grey.Medium).Background(Colors.Grey.Lighten4).Padding(6).AlignRight().Text(fakturyPierwotne.Count.ToString()).Bold();
                table.Cell().Border(0.5f).BorderColor(Colors.Grey.Medium).Background(Colors.Grey.Lighten4).Padding(6).Text("Liczba korekt:").SemiBold();
                table.Cell().Border(0.5f).BorderColor(Colors.Grey.Medium).Background(Colors.Grey.Lighten4).Padding(6).AlignRight().Text(korekty.Count.ToString()).Bold();

                table.Cell().Border(0.5f).BorderColor(Colors.Grey.Medium).Padding(6).Text("Suma netto:");
                table.Cell().Border(0.5f).BorderColor(Colors.Grey.Medium).Padding(6).AlignRight().Text($"{sumaNetto:N2} zł");
                table.Cell().Border(0.5f).BorderColor(Colors.Grey.Medium).Padding(6).Text("Suma VAT:");
                table.Cell().Border(0.5f).BorderColor(Colors.Grey.Medium).Padding(6).AlignRight().Text($"{sumaVat:N2} zł");

                table.Cell().ColumnSpan(2).Border(0.5f).BorderColor(Colors.Grey.Medium).Background(Colors.Green.Lighten4).Padding(6).Text("SUMA BRUTTO:").Bold();
                table.Cell().ColumnSpan(2).Border(0.5f).BorderColor(Colors.Grey.Medium).Background(Colors.Green.Lighten4).Padding(6).AlignRight().Text($"{sumaBrutto:N2} zł").Bold().FontSize(11);
            });

            // VAT wg stawek
            if (vatWgStawek.Any())
            {
                column.Item().PaddingTop(10).Text("ROZLICZENIE VAT WG STAWEK").Bold().FontSize(12);
                
                column.Item().Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.ConstantColumn(100);
                        columns.ConstantColumn(120);
                    });

                    table.Header(header =>
                    {
                        header.Cell().Border(0.5f).BorderColor(Colors.Grey.Medium).Background(Colors.Grey.Lighten3).Padding(4).AlignCenter().Text("Stawka VAT").Bold().FontSize(8);
                        header.Cell().Border(0.5f).BorderColor(Colors.Grey.Medium).Background(Colors.Grey.Lighten3).Padding(4).AlignCenter().Text("Kwota VAT").Bold().FontSize(8);
                    });

                    foreach (var kv in vatWgStawek.OrderByDescending(x => x.Key))
                    {
                        var etykieta = kv.Key == 0 ? "zw" : $"{kv.Key}%";
                        table.Cell().Border(0.5f).BorderColor(Colors.Grey.Medium).Padding(4).AlignCenter().Text(etykieta);
                        table.Cell().Border(0.5f).BorderColor(Colors.Grey.Medium).Padding(4).AlignRight().Text($"{kv.Value:N2} zł");
                    }
                });
            }

            // Lista faktur
            column.Item().PaddingTop(15).Text("SZCZEGÓŁOWA LISTA DOKUMENTÓW").Bold().FontSize(12);

            if (!_faktury.Any())
            {
                column.Item().Padding(20).AlignCenter().Text("Brak dokumentów w wybranym okresie").FontColor(Colors.Grey.Medium);
            }
            else
            {
                column.Item().Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.ConstantColumn(20);
                        columns.ConstantColumn(70);
                        columns.ConstantColumn(55);
                        columns.RelativeColumn();
                        columns.ConstantColumn(70);
                        columns.ConstantColumn(60);
                        columns.ConstantColumn(50);
                        columns.ConstantColumn(60);
                        columns.ConstantColumn(45);
                    });

                    table.Header(header =>
                    {
                        header.Cell().Border(0.5f).BorderColor(Colors.Grey.Medium).Background(Colors.Grey.Lighten3).Padding(3).AlignCenter().Text("LP").Bold().FontSize(7);
                        header.Cell().Border(0.5f).BorderColor(Colors.Grey.Medium).Background(Colors.Grey.Lighten3).Padding(3).AlignCenter().Text("NUMER").Bold().FontSize(7);
                        header.Cell().Border(0.5f).BorderColor(Colors.Grey.Medium).Background(Colors.Grey.Lighten3).Padding(3).AlignCenter().Text("DATA").Bold().FontSize(7);
                        header.Cell().Border(0.5f).BorderColor(Colors.Grey.Medium).Background(Colors.Grey.Lighten3).Padding(3).AlignCenter().Text("KONTRAHENT").Bold().FontSize(7);
                        header.Cell().Border(0.5f).BorderColor(Colors.Grey.Medium).Background(Colors.Grey.Lighten3).Padding(3).AlignCenter().Text("NIP").Bold().FontSize(7);
                        header.Cell().Border(0.5f).BorderColor(Colors.Grey.Medium).Background(Colors.Grey.Lighten3).Padding(3).AlignCenter().Text("NETTO").Bold().FontSize(7);
                        header.Cell().Border(0.5f).BorderColor(Colors.Grey.Medium).Background(Colors.Grey.Lighten3).Padding(3).AlignCenter().Text("VAT").Bold().FontSize(7);
                        header.Cell().Border(0.5f).BorderColor(Colors.Grey.Medium).Background(Colors.Grey.Lighten3).Padding(3).AlignCenter().Text("BRUTTO").Bold().FontSize(7);
                        header.Cell().Border(0.5f).BorderColor(Colors.Grey.Medium).Background(Colors.Grey.Lighten3).Padding(3).AlignCenter().Text("TYP").Bold().FontSize(7);
                    });

                    var lp = 1;
                    foreach (var faktura in _faktury)
                    {
                        var isKorekta = faktura.TypDokumentu == "KOREKTA";
                        var bgColor = isKorekta ? Colors.Red.Lighten5 : Colors.White;
                        var textColor = isKorekta && faktura.KwotaBrutto < 0 ? Colors.Red.Medium : Colors.Black;

                        table.Cell().Border(0.5f).BorderColor(Colors.Grey.Medium).Background(bgColor).Padding(2).AlignCenter().Text((lp++).ToString()).FontSize(7);
                        table.Cell().Border(0.5f).BorderColor(Colors.Grey.Medium).Background(bgColor).Padding(2).Text(faktura.NumerFaktury).FontSize(7);
                        table.Cell().Border(0.5f).BorderColor(Colors.Grey.Medium).Background(bgColor).Padding(2).AlignCenter().Text(faktura.DataWystawienia.ToString("dd.MM.yy")).FontSize(7);
                        table.Cell().Border(0.5f).BorderColor(Colors.Grey.Medium).Background(bgColor).Padding(2).Text(TruncateText(faktura.IdKontrahentNavigation?.NazwaFirmy ?? "", 30)).FontSize(7);
                        table.Cell().Border(0.5f).BorderColor(Colors.Grey.Medium).Background(bgColor).Padding(2).Text(faktura.IdKontrahentNavigation?.Nip ?? "").FontSize(7);
                        table.Cell().Border(0.5f).BorderColor(Colors.Grey.Medium).Background(bgColor).Padding(2).AlignRight().Text($"{faktura.KwotaNetto:N2}").FontSize(7).FontColor(textColor);
                        table.Cell().Border(0.5f).BorderColor(Colors.Grey.Medium).Background(bgColor).Padding(2).AlignRight().Text($"{faktura.KwotaVat:N2}").FontSize(7).FontColor(textColor);
                        table.Cell().Border(0.5f).BorderColor(Colors.Grey.Medium).Background(bgColor).Padding(2).AlignRight().Text($"{faktura.KwotaBrutto:N2}").FontSize(7).FontColor(textColor);
                        table.Cell().Border(0.5f).BorderColor(Colors.Grey.Medium).Background(bgColor).Padding(2).AlignCenter().Text(faktura.TypDokumentu ?? "FAKTURA").FontSize(6);
                    }

                    // Suma
                    table.Cell().ColumnSpan(5).Border(0.5f).BorderColor(Colors.Grey.Medium).Background(Colors.Grey.Lighten3).Padding(3).AlignRight().Text("RAZEM:").Bold().FontSize(8);
                    table.Cell().Border(0.5f).BorderColor(Colors.Grey.Medium).Background(Colors.Grey.Lighten3).Padding(3).AlignRight().Text($"{sumaNetto:N2}").Bold().FontSize(8);
                    table.Cell().Border(0.5f).BorderColor(Colors.Grey.Medium).Background(Colors.Grey.Lighten3).Padding(3).AlignRight().Text($"{sumaVat:N2}").Bold().FontSize(8);
                    table.Cell().Border(0.5f).BorderColor(Colors.Grey.Medium).Background(Colors.Grey.Lighten3).Padding(3).AlignRight().Text($"{sumaBrutto:N2}").Bold().FontSize(8);
                    table.Cell().Border(0.5f).BorderColor(Colors.Grey.Medium).Background(Colors.Grey.Lighten3).Padding(3);
                });
            }
        });
    }

    private void ComposeFooter(IContainer container)
    {
        container.Column(col =>
        {
            col.Item().LineHorizontal(0.5f).LineColor(Colors.Grey.Medium);
            col.Item().PaddingTop(5).Row(row =>
            {
                row.RelativeItem().Text($"{_firmSettings.NazwaFirmy}").FontSize(8).FontColor(Colors.Grey.Medium);
                row.RelativeItem().AlignRight().Text(text =>
                {
                    text.Span("Strona ").FontSize(8).FontColor(Colors.Grey.Medium);
                    text.CurrentPageNumber().FontSize(8).FontColor(Colors.Grey.Medium);
                    text.Span(" z ").FontSize(8).FontColor(Colors.Grey.Medium);
                    text.TotalPages().FontSize(8).FontColor(Colors.Grey.Medium);
                });
            });
        });
    }

    private static string TruncateText(string text, int maxLength)
    {
        if (string.IsNullOrEmpty(text)) return "";
        return text.Length <= maxLength ? text : text.Substring(0, maxLength - 3) + "...";
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

