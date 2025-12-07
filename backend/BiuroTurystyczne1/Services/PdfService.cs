using PdfSharp.Pdf;
using PdfSharp.Pdf.IO;

namespace BiuroTurystyczne1.Services;

public interface IPdfService
{
    byte[] ExtractFirstPage(byte[] fullPdf);
}

public class PdfService : IPdfService
{
    public byte[] ExtractFirstPage(byte[] fullPdf)
    {
        try
        {
            using var msInput = new MemoryStream(fullPdf);
            using var msOutput = new MemoryStream();
            
            // ✅ Wczytaj PDF (PdfSharp jest bardziej tolerancyjny)
            var srcDoc = PdfReader.Open(msInput, PdfDocumentOpenMode.Import);
            
            // ✅ Jeśli jest tylko 1 strona, zwróć oryginalny PDF
            if (srcDoc.PageCount == 1)
            {
                return fullPdf;
            }
            
            // ✅ Utwórz nowy dokument z tylko pierwszą stroną
            var destDoc = new PdfDocument();
            destDoc.AddPage(srcDoc.Pages[0]);
            
            // ✅ Zapisz do stream
            destDoc.Save(msOutput, false);
            
            return msOutput.ToArray();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Błąd podczas ekstrakcji strony PDF: {ex.Message}");
            // ✅ W razie błędu, zwróć oryginalny PDF
            return fullPdf;
        }
    }
}