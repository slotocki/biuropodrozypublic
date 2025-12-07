using BiuroTurystyczne1.Data.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BiuroTurystyczne1.Controllers.invoice_vat;

[ApiController]
[Route("api/[controller]")] // To tworzy adres /api/uslugi
[Authorize]
public class UslugiController : ControllerBase
{
    private readonly BiuroDbContext _context;

    public UslugiController(BiuroDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetUslugi()
    {
        return Ok(await _context.Uslugas.ToListAsync());
    }

    [HttpPost]
    public async Task<IActionResult> CreateUsluga(Usluga usluga)
    {
        _context.Uslugas.Add(usluga);
        await _context.SaveChangesAsync();
        return Ok(usluga);
    }
    
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteUsluga(uint id)
    {
        var usluga = await _context.Uslugas.FindAsync(id);
        if (usluga == null)
        {
            return NotFound();
        }
        _context.Uslugas.Remove(usluga);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}