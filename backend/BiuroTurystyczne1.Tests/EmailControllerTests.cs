using Xunit;
using Moq;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Hosting;
using BiuroTurystyczne1.Controllers.invoice_vat;
using BiuroTurystyczne1.Data.Models;
using BiuroTurystyczne1.Infrastructure.Email;
using BiuroTurystyczne1.Services;
using System.IO;

namespace BiuroTurystyczne1.Tests.Controllers;

public class EmailControllerTests : IDisposable
{
    private readonly Mock<IEmailService> _mockEmailService;
    private readonly Mock<IPdfService> _mockPdfService;
    private readonly Mock<IWebHostEnvironment> _mockEnvironment;
    private readonly BiuroDbContext _context;
    private readonly EmailController _controller;
    private readonly string _testFolderPath;

    public EmailControllerTests()
    {
        // Setup In-Memory Database
        var options = new DbContextOptionsBuilder<BiuroDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new BiuroDbContext(options);

        // Mock services
        _mockEmailService = new Mock<IEmailService>();
        _mockPdfService = new Mock<IPdfService>();
        _mockEnvironment = new Mock<IWebHostEnvironment>();

        // Setup test folder
        _testFolderPath = Path.Combine(Path.GetTempPath(), "TestFaktury");
        Directory.CreateDirectory(_testFolderPath);
        _mockEnvironment.Setup(e => e.ContentRootPath).Returns(Path.GetTempPath());

        _controller = new EmailController(
            _context,
            _mockEmailService.Object,
            _mockPdfService.Object,
            _mockEnvironment.Object
        );

        SeedTestData();
    }

    private void SeedTestData()
    {
        var kontrahent = new Kontrahent
        {
            IdKontrahent = 1,
            NazwaFirmy = "Test Firma",
            Nip = "1234567890",
            Email = "test@example.com"
        };
        _context.Kontrahents.Add(kontrahent);

        var faktura1 = new FakturaVat
        {
            IdFaktura = 1,
            NumerFaktury = "1/10/2025",
            DataWystawienia = new DateOnly(2025, 10, 26),
            KwotaBrutto = 123.00m,
            IdKontrahent = 1,
            SciezkaPdf = Path.Combine("Generated", "Invoices", "2025", "10", "faktura-1_10_2025.pdf")
        };

        var faktura2 = new FakturaVat
        {
            IdFaktura = 2,
            NumerFaktury = "2/10/2025",
            DataWystawienia = new DateOnly(2025, 10, 26),
            KwotaBrutto = 456.00m,
            IdKontrahent = 1,
            SciezkaPdf = Path.Combine("Generated", "Invoices", "2025", "10", "faktura-2_10_2025.pdf")
        };

        _context.FakturaVats.AddRange(faktura1, faktura2);
        _context.SaveChanges();

        // Create test PDF files
        CreateTestPdfFile(faktura1.SciezkaPdf);
        CreateTestPdfFile(faktura2.SciezkaPdf);
    }

    private void CreateTestPdfFile(string relativePath)
    {
        var fullPath = Path.Combine(Directory.GetCurrentDirectory(), relativePath);
        Directory.CreateDirectory(Path.GetDirectoryName(fullPath));
        File.WriteAllBytes(fullPath, new byte[] { 0x25, 0x50, 0x44, 0x46 }); // PDF header
    }

    [Fact]
    public async Task SendFaktury_WithValidRequest_ReturnsOk()
    {
        // Arrange
        var request = new SendFakturyEmailDto
        {
            IdFaktury = new List<uint> { 1 },
            RecipientEmail = "recipient@example.com",
            Subject = "Test Subject",
            Body = "Test Body"
        };

        _mockPdfService
            .Setup(s => s.ExtractFirstPage(It.IsAny<byte[]>()))
            .Returns(new byte[] { 0x25, 0x50, 0x44, 0x46 });

        _mockEmailService
            .Setup(s => s.SendEmailWithAttachmentsAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<List<EmailAttachment>>(),
                It.IsAny<string>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _controller.SendFaktury(request);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = okResult.Value as dynamic;
        Assert.NotNull(response);
        Assert.Equal("Email został wysłany pomyślnie", response.GetType().GetProperty("message").GetValue(response));
        
        _mockEmailService.Verify(s => s.SendEmailWithAttachmentsAsync(
            "recipient@example.com",
            "Test Subject",
            "Test Body",
            It.Is<List<EmailAttachment>>(a => a.Count == 1),
            null), Times.Once);
    }

    [Fact]
    public async Task SendFaktury_WithMultipleInvoices_SendsAllAttachments()
    {
        // Arrange
        var request = new SendFakturyEmailDto
        {
            IdFaktury = new List<uint> { 1, 2 },
            RecipientEmail = "recipient@example.com"
        };

        _mockPdfService
            .Setup(s => s.ExtractFirstPage(It.IsAny<byte[]>()))
            .Returns(new byte[] { 0x25, 0x50, 0x44, 0x46 });

        _mockEmailService
            .Setup(s => s.SendEmailWithAttachmentsAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<List<EmailAttachment>>(),
                It.IsAny<string>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _controller.SendFaktury(request);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = okResult.Value as dynamic;
        Assert.Equal(2, (int)response.GetType().GetProperty("sentFiles").GetValue(response));
        
        _mockEmailService.Verify(s => s.SendEmailWithAttachmentsAsync(
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.Is<List<EmailAttachment>>(a => a.Count == 2),
            It.IsAny<string>()), Times.Once);
    }

    [Fact]
    public async Task SendFaktury_WithNonExistentInvoices_ReturnsNotFound()
    {
        // Arrange
        var request = new SendFakturyEmailDto
        {
            IdFaktury = new List<uint> { 999 },
            RecipientEmail = "recipient@example.com"
        };

        // Act
        var result = await _controller.SendFaktury(request);

        // Assert
        var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
        Assert.Equal("Nie znaleziono żadnych faktur.", notFoundResult.Value);
    }

    [Fact]
    public async Task SendFaktury_WithMissingPdfFiles_ReturnsBadRequest()
    {
        // Arrange
        var faktura3 = new FakturaVat
        {
            IdFaktura = 3,
            NumerFaktury = "3/10/2025",
            DataWystawienia = new DateOnly(2025, 10, 26),
            KwotaBrutto = 789.00m,
            IdKontrahent = 1,
            SciezkaPdf = "NonExistent/Path/faktura.pdf"
        };
        _context.FakturaVats.Add(faktura3);
        await _context.SaveChangesAsync();

        var request = new SendFakturyEmailDto
        {
            IdFaktury = new List<uint> { 3 },
            RecipientEmail = "recipient@example.com"
        };

        // Act
        var result = await _controller.SendFaktury(request);

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
        var response = badRequestResult.Value as dynamic;
        Assert.Contains("Nie znaleziono plików PDF", 
            response.GetType().GetProperty("message").GetValue(response).ToString());
    }

    [Fact]
    public async Task SendFaktury_WithCopyToKontrahent_SendsCc()
    {
        // Arrange
        var request = new SendFakturyEmailDto
        {
            IdFaktury = new List<uint> { 1 },
            RecipientEmail = "recipient@example.com",
            SendCopyToId1 = true
        };

        _mockPdfService
            .Setup(s => s.ExtractFirstPage(It.IsAny<byte[]>()))
            .Returns(new byte[] { 0x25, 0x50, 0x44, 0x46 });

        _mockEmailService
            .Setup(s => s.SendEmailWithAttachmentsAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<List<EmailAttachment>>(),
                It.IsAny<string>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _controller.SendFaktury(request);

        // Assert
        _mockEmailService.Verify(s => s.SendEmailWithAttachmentsAsync(
            "recipient@example.com",
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<List<EmailAttachment>>(),
            "test@example.com"), Times.Once);
    }

    [Fact]
    public async Task SendFaktury_WhenEmailServiceThrows_ReturnsInternalServerError()
    {
        // Arrange
        var request = new SendFakturyEmailDto
        {
            IdFaktury = new List<uint> { 1 },
            RecipientEmail = "recipient@example.com"
        };

        _mockPdfService
            .Setup(s => s.ExtractFirstPage(It.IsAny<byte[]>()))
            .Returns(new byte[] { 0x25, 0x50, 0x44, 0x46 });

        _mockEmailService
            .Setup(s => s.SendEmailWithAttachmentsAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<List<EmailAttachment>>(),
                It.IsAny<string>()))
            .ThrowsAsync(new Exception("SMTP Error"));

        // Act
        var result = await _controller.SendFaktury(request);

        // Assert
        var statusCodeResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(500, statusCodeResult.StatusCode);
        
        var response = statusCodeResult.Value as dynamic;
        Assert.Contains("Błąd podczas wysyłania emaila", 
            response.GetType().GetProperty("message").GetValue(response).ToString());
    }

    [Fact]
    public async Task SendFaktury_ExtractsFirstPageOnly()
    {
        // Arrange
        var request = new SendFakturyEmailDto
        {
            IdFaktury = new List<uint> { 1 },
            RecipientEmail = "recipient@example.com"
        };

        var fullPdf = new byte[] { 1, 2, 3, 4, 5 };
        var firstPagePdf = new byte[] { 1, 2 };

        _mockPdfService
            .Setup(s => s.ExtractFirstPage(It.IsAny<byte[]>()))
            .Returns(firstPagePdf);

        _mockEmailService
            .Setup(s => s.SendEmailWithAttachmentsAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<List<EmailAttachment>>(),
                It.IsAny<string>()))
            .Returns(Task.CompletedTask);

        // Act
        await _controller.SendFaktury(request);

        // Assert
        _mockPdfService.Verify(s => s.ExtractFirstPage(It.IsAny<byte[]>()), Times.Once);
        
        _mockEmailService.Verify(s => s.SendEmailWithAttachmentsAsync(
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.Is<List<EmailAttachment>>(a => 
                a.Count == 1 && 
                a[0].Content.SequenceEqual(firstPagePdf)),
            It.IsAny<string>()), Times.Once);
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();

        // Cleanup test files
        if (Directory.Exists(_testFolderPath))
        {
            Directory.Delete(_testFolderPath, true);
        }

        var generatedPath = Path.Combine(Directory.GetCurrentDirectory(), "Generated");
        if (Directory.Exists(generatedPath))
        {
            Directory.Delete(generatedPath, true);
        }
    }
}
