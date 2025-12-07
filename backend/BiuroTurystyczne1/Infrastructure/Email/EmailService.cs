using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using Microsoft.Extensions.Options;

namespace BiuroTurystyczne1.Infrastructure.Email;

public interface IEmailService
{
    Task SendEmailWithAttachmentsAsync(
        string toEmail, 
        string subject, 
        string body, 
        List<EmailAttachment> attachments,
        string? ccEmail = null);
}

public class EmailAttachment
{
    public string FileName { get; set; } = string.Empty;
    public byte[] Content { get; set; } = Array.Empty<byte>();
    public string ContentType { get; set; } = "application/pdf";
}

public class EmailService : IEmailService
{
    private readonly EmailSettings _settings;

    public EmailService(IOptions<EmailSettings> settings)
    {
        _settings = settings.Value;
    }

    public async Task SendEmailWithAttachmentsAsync(
        string toEmail, 
        string subject, 
        string body, 
        List<EmailAttachment> attachments,
        string? ccEmail = null)
    {
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_settings.SenderName, _settings.SenderEmail));
        message.To.Add(MailboxAddress.Parse(toEmail));
        
        if (!string.IsNullOrEmpty(ccEmail))
        {
            message.Cc.Add(MailboxAddress.Parse(ccEmail));
        }
        
        message.Subject = subject;

        var builder = new BodyBuilder
        {
            TextBody = body
        };

        // Dodaj załączniki
        foreach (var attachment in attachments)
        {
            builder.Attachments.Add(attachment.FileName, attachment.Content, ContentType.Parse(attachment.ContentType));
        }

        message.Body = builder.ToMessageBody();

        using var client = new SmtpClient();
        
        await client.ConnectAsync(_settings.SmtpHost, _settings.SmtpPort, 
            _settings.UseSsl ? SecureSocketOptions.StartTls : SecureSocketOptions.None);
        
        await client.AuthenticateAsync(_settings.SmtpUser, _settings.SmtpPass);
        await client.SendAsync(message);
        await client.DisconnectAsync(true);
    }
}
