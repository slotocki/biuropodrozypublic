using BiuroTurystyczne1.Data.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace BiuroTurystyczne1.Controllers.offer;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SimpleDictionaryController : ControllerBase
{
    private readonly BiuroDbContext _context;

    public SimpleDictionaryController(BiuroDbContext context)
    {
        _context = context;
    }

    // GET: api/SimpleDictionary/destynacja
    [HttpGet("{entityType}")]
    public async Task<IActionResult> GetAll(string entityType)
    {
        object? data = entityType.ToLower() switch
        {
            "destynacja" => await _context.Destynacjas
                .Select(d => new { d.IdDestynacja, d.Nazwa })
                .ToListAsync(),
            
            "transport" => await _context.Transports
                .Select(t => new { t.IdTransport, t.RodzajTransportu })
                .ToListAsync(),
            
            "wyzywienie" => await _context.Wyzywienies  
                .Select(w => new { w.IdWyzywienie, w.RodzajWyzywienia })
                .ToListAsync(),
            
            "miejsce" => await _context.MiejsceOdjazdus 
                .Select(m => new { m.IdMiejsce, m.NazwaMiejsca, m.Adres, m.Opis })
                .ToListAsync(),
            
            _ => null
        };

        if (data == null) return BadRequest(new { message = "Nieprawidłowy typ encji." });
        return Ok(data);
    }

    // POST: api/SimpleDictionary/destynacja
    [HttpPost("{entityType}")]
    public async Task<IActionResult> Create(string entityType, [FromBody] JsonElement body)
    {
        try
        {
            switch (entityType.ToLower())
            {
                case "destynacja":
                    var destynacja = new Destynacja 
                    { 
                        Nazwa = body.GetProperty("nazwa").GetString() ?? string.Empty 
                    };
                    _context.Destynacjas.Add(destynacja);
                    await _context.SaveChangesAsync();
                    return Ok(new { destynacja.IdDestynacja, destynacja.Nazwa });

                case "transport":
                    var transport = new Transport 
                    { 
                        RodzajTransportu = body.GetProperty("rodzajTransportu").GetString() ?? string.Empty 
                    };
                    _context.Transports.Add(transport);
                    await _context.SaveChangesAsync();
                    return Ok(new { transport.IdTransport, transport.RodzajTransportu });

                case "wyzywienie":
                    var wyzywienie = new Wyzywienie 
                    { 
                        RodzajWyzywienia = body.GetProperty("rodzajWyzywienia").GetString() ?? string.Empty 
                    };
                    _context.Wyzywienies.Add(wyzywienie);  // ✅ ZMIENIONE
                    await _context.SaveChangesAsync();
                    return Ok(new { wyzywienie.IdWyzywienie, wyzywienie.RodzajWyzywienia });

                case "miejsce":
                    var miejsce = new MiejsceOdjazdu 
                    { 
                        NazwaMiejsca = body.GetProperty("nazwaMiejsca").GetString() ?? string.Empty,
                        Adres = body.TryGetProperty("adres", out var a) ? a.GetString() : null,
                        Opis = body.TryGetProperty("opis", out var o) ? o.GetString() : null
                    };
                    _context.MiejsceOdjazdus.Add(miejsce);  // ✅ ZMIENIONE
                    await _context.SaveChangesAsync();
                    return Ok(new { miejsce.IdMiejsce, miejsce.NazwaMiejsca, miejsce.Adres, miejsce.Opis });

                default:
                    return BadRequest(new { message = "Nieprawidłowy typ encji." });
            }
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    // PUT: api/SimpleDictionary/destynacja/5
    [HttpPut("{entityType}/{id}")]
    public async Task<IActionResult> Update(string entityType, int id, [FromBody] JsonElement body)
    {
        try
        {
            switch (entityType.ToLower())
            {
                case "destynacja":
                    var destynacja = await _context.Destynacjas.FindAsync((uint)id);
                    if (destynacja == null) return NotFound();
                    destynacja.Nazwa = body.GetProperty("nazwa").GetString() ?? string.Empty;
                    break;

                case "transport":
                    var transport = await _context.Transports.FindAsync((uint)id);
                    if (transport == null) return NotFound();
                    transport.RodzajTransportu = body.GetProperty("rodzajTransportu").GetString() ?? string.Empty;
                    break;

                case "wyzywienie":
                    var wyzywienie = await _context.Wyzywienies.FindAsync((uint)id);  // ✅ ZMIENIONE
                    if (wyzywienie == null) return NotFound();
                    wyzywienie.RodzajWyzywienia = body.GetProperty("rodzajWyzywienia").GetString() ?? string.Empty;
                    break;

                case "miejsce":
                    var miejsce = await _context.MiejsceOdjazdus.FindAsync((uint)id);  // ✅ ZMIENIONE
                    if (miejsce == null) return NotFound();
                    miejsce.NazwaMiejsca = body.GetProperty("nazwaMiejsca").GetString() ?? string.Empty;
                    if (body.TryGetProperty("adres", out var a)) miejsce.Adres = a.GetString();
                    if (body.TryGetProperty("opis", out var o)) miejsce.Opis = o.GetString();
                    break;

                default:
                    return BadRequest();
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    // DELETE: api/SimpleDictionary/destynacja/5
    [HttpDelete("{entityType}/{id}")]
    public async Task<IActionResult> Delete(string entityType, int id)
    {
        try
        {
            switch (entityType.ToLower())
            {
                case "destynacja":
                    var destynacja = await _context.Destynacjas.FindAsync((uint)id);
                    if (destynacja == null) return NotFound();
                    _context.Destynacjas.Remove(destynacja);
                    break;

                case "transport":
                    var transport = await _context.Transports.FindAsync((uint)id);
                    if (transport == null) return NotFound();
                    _context.Transports.Remove(transport);
                    break;

                case "wyzywienie":
                    var wyzywienie = await _context.Wyzywienies.FindAsync((uint)id);  // ✅ ZMIENIONE
                    if (wyzywienie == null) return NotFound();
                    _context.Wyzywienies.Remove(wyzywienie);  // ✅ ZMIENIONE
                    break;

                case "miejsce":
                    var miejsce = await _context.MiejsceOdjazdus.FindAsync((uint)id);  // ✅ ZMIENIONE
                    if (miejsce == null) return NotFound();
                    _context.MiejsceOdjazdus.Remove(miejsce);  // ✅ ZMIENIONE
                    break;

                default:
                    return BadRequest();
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }
        catch (DbUpdateException)
        {
            return BadRequest(new { message = "Nie można usunąć - element jest używany w innych miejscach." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }
}
