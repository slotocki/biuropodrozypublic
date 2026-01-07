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
            
           
            var srcDoc = PdfReader.Open(msInput, PdfDocumentOpenMode.Import);
            
           
            if (srcDoc.PageCount == 1)
            {
                return fullPdf;
            }
            
          
            var destDoc = new PdfDocument();
            destDoc.AddPage(srcDoc.Pages[0]);
            
           
            destDoc.Save(msOutput, false);
            
            return msOutput.ToArray();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Błąd podczas ekstrakcji strony PDF: {ex.Message}");
            
            return fullPdf;
        }
    }
}