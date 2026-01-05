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

    // GET: api/SimpleDictionary/destynacja  (lub inne typy)
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

            "pokoje-rodzaj" => await _context.PokojRodzajs
                .Select(r => new { r.IdRodzajPokoju, r.RodzajPokoju })
                .ToListAsync(),

            "nazwahandlowa" => await _context.NazwaHandlowas
                .OrderBy(n => n.NazwaHandlowa1)
                .Select(n => new { n.IdNazwaHandlowa, Nazwa = n.NazwaHandlowa1, n.Opis })
                .ToListAsync(),

            _ => null
        };

        if (data == null)
            return BadRequest(new { message = "Nieprawidłowy typ encji." });

        return Ok(data);
    }


    // POST: api/SimpleDictionary/{entityType}
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
                    _context.Wyzywienies.Add(wyzywienie);
                    await _context.SaveChangesAsync();
                    return Ok(new { wyzywienie.IdWyzywienie, wyzywienie.RodzajWyzywienia });

                case "miejsce":
                    var miejsce = new MiejsceOdjazdu
                    {
                        NazwaMiejsca = body.GetProperty("nazwaMiejsca").GetString() ?? string.Empty,
                        Adres = body.TryGetProperty("adres", out var a) ? a.GetString() : null,
                        Opis = body.TryGetProperty("opis", out var o) ? o.GetString() : null
                    };
                    _context.MiejsceOdjazdus.Add(miejsce);
                    await _context.SaveChangesAsync();
                    return Ok(new { miejsce.IdMiejsce, miejsce.NazwaMiejsca, miejsce.Adres, miejsce.Opis });

                case "pokoje-rodzaj":
                    var rodzaj = new PokojRodzaj
                    {
                        RodzajPokoju = body.GetProperty("rodzajPokoju").GetString() ?? string.Empty
                    };
                    _context.PokojRodzajs.Add(rodzaj);
                    await _context.SaveChangesAsync();
                    return Ok(new { rodzaj.IdRodzajPokoju, rodzaj.RodzajPokoju });

                case "nazwahandlowa":
                    var nowaNazwa = new NazwaHandlowa
                    {
                        NazwaHandlowa1 = body.GetProperty("nazwa").GetString() ?? string.Empty,
                        Opis = body.TryGetProperty("opis", out var opisN) ? opisN.GetString() : null
                    };
                    _context.NazwaHandlowas.Add(nowaNazwa);
                    await _context.SaveChangesAsync();
                    return Ok(new { nowaNazwa.IdNazwaHandlowa, Nazwa = nowaNazwa.NazwaHandlowa1, nowaNazwa.Opis });

                default:
                    return BadRequest(new { message = "Nieprawidłowy typ encji." });
            }
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }


    // PUT: api/SimpleDictionary/{entityType}/{id}
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
                    var wyzywienie = await _context.Wyzywienies.FindAsync((uint)id);
                    if (wyzywienie == null) return NotFound();
                    wyzywienie.RodzajWyzywienia = body.GetProperty("rodzajWyzywienia").GetString() ?? string.Empty;
                    break;

                case "miejsce":
                    var miejsce = await _context.MiejsceOdjazdus.FindAsync((uint)id);
                    if (miejsce == null) return NotFound();
                    miejsce.NazwaMiejsca = body.GetProperty("nazwaMiejsca").GetString() ?? string.Empty;
                    if (body.TryGetProperty("adres", out var a)) miejsce.Adres = a.GetString();
                    if (body.TryGetProperty("opis", out var o)) miejsce.Opis = o.GetString();
                    break;

                case "pokoje-rodzaj":
                    var rodzaj = await _context.PokojRodzajs.FindAsync((uint)id);
                    if (rodzaj == null) return NotFound();
                    rodzaj.RodzajPokoju = body.GetProperty("rodzajPokoju").GetString() ?? string.Empty;
                    break;

                case "nazwahandlowa":
                    var nazwa = await _context.NazwaHandlowas.FindAsync((uint)id);
                    if (nazwa == null) return NotFound();
                    nazwa.NazwaHandlowa1 = body.GetProperty("nazwa").GetString() ?? string.Empty;
                    if (body.TryGetProperty("opis", out var opisN)) nazwa.Opis = opisN.GetString();
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


    // DELETE: api/SimpleDictionary/{entityType}/{id}
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
                    var wyzywienie = await _context.Wyzywienies.FindAsync((uint)id);
                    if (wyzywienie == null) return NotFound();
                    _context.Wyzywienies.Remove(wyzywienie);
                    break;

                case "miejsce":
                    var miejsce = await _context.MiejsceOdjazdus.FindAsync((uint)id);
                    if (miejsce == null) return NotFound();
                    _context.MiejsceOdjazdus.Remove(miejsce);
                    break;

                case "pokoje-rodzaj":
                    var rodzaj = await _context.PokojRodzajs.FindAsync((uint)id);
                    if (rodzaj == null) return NotFound();
                    var hasPokoje = await _context.Pokojs.AnyAsync(p => p.IdRodzajPokoju == (uint)id);
                    if (hasPokoje)
                        return BadRequest(new { message = "Nie można usunąć rodzaju pokoju, który jest przypisany do pokoi." });
                    _context.PokojRodzajs.Remove(rodzaj);
                    break;

                case "nazwahandlowa":
                    var nazwa = await _context.NazwaHandlowas.FindAsync((uint)id);
                    if (nazwa == null) return NotFound();
                    var hasOferty = await _context.Oferta.AnyAsync(o => o.IdNazwaHandlowa == (uint)id);
                    if (hasOferty)
                        return BadRequest(new { message = "Nie można usunąć nazwy handlowej, która jest przypisana do ofert." });
                    _context.NazwaHandlowas.Remove(nazwa);
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
