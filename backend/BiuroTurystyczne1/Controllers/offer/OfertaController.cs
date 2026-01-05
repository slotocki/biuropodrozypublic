// Controllers/offer/OfertaController.cs
using BiuroTurystyczne1.Data.DTOs;
using BiuroTurystyczne1.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BiuroTurystyczne1.Controllers.offer;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OfertaController : ControllerBase
{
    private readonly OfertaService _ofertaService;
    private readonly ILogger<OfertaController> _logger;

    public OfertaController(OfertaService ofertaService, ILogger<OfertaController> logger)
    {
        _ofertaService = ofertaService;
        _logger = logger;
    }

    /// <summary>
    /// GET: api/Oferta
    /// Pobiera listę ofert z możliwością wyszukiwania i filtrowania
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetOferty([FromQuery] OfertaSearchDto searchParams)
    {
        try
        {
            var oferty = await _ofertaService.GetOfertySummaryAsync(searchParams);
            return Ok(oferty);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Błąd podczas pobierania listy ofert");
            return StatusCode(500, new { message = "Wystąpił błąd podczas pobierania ofert" });
        }
    }

    /// <summary>
    /// GET: api/Oferta/{id}
    /// Pobiera szczegóły pojedynczej oferty
    /// </summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetOferta(uint id)
    {
        try
        {
            var oferta = await _ofertaService.GetOfertaDetailAsync(id);
            
            if (oferta == null)
                return NotFound(new { message = $"Nie znaleziono oferty o ID: {id}" });

            return Ok(oferta);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Błąd podczas pobierania oferty {IdOferta}", id);
            return StatusCode(500, new { message = "Wystąpił błąd podczas pobierania oferty" });
        }
    }

    /// <summary>
    /// POST: api/Oferta
    /// Tworzy nową ofertę
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateOferta([FromBody] OfertaCreateDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        try
        {
            var idOferta = await _ofertaService.CreateOfertaAsync(dto);
            return CreatedAtAction(nameof(GetOferta), new { id = idOferta }, new { idOferta });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Błąd podczas tworzenia oferty");
            return StatusCode(500, new { message = "Wystąpił błąd podczas tworzenia oferty" });
        }
    }

    /// <summary>
    /// PUT: api/Oferta/{id}
    /// Aktualizuje istniejącą ofertę
    /// </summary>
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateOferta(uint id, [FromBody] OfertaUpdateDto dto)
    {
        if (id != dto.IdOferta)
            return BadRequest(new { message = "ID w URL nie zgadza się z ID w body" });

        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        try
        {
            var success = await _ofertaService.UpdateOfertaAsync(dto);
            
            if (!success)
                return NotFound(new { message = $"Nie znaleziono oferty o ID: {id}" });

            return Ok(new { message = "Oferta została zaktualizowana" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Błąd podczas aktualizacji oferty {IdOferta}", id);
            return StatusCode(500, new { message = "Wystąpił błąd podczas aktualizacji oferty" });
        }
    }

    /// <summary>
    /// DELETE: api/Oferta/{id}
    /// Archiwizuje ofertę (soft delete)
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> ArchiveOferta(uint id)
    {
        try
        {
            var success = await _ofertaService.ArchiveOfertaAsync(id);
            
            if (!success)
                return NotFound(new { message = $"Nie znaleziono oferty o ID: {id}" });

            return Ok(new { message = "Oferta została zarchiwizowana" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Błąd podczas archiwizacji oferty {IdOferta}", id);
            return StatusCode(500, new { message = "Wystąpił błąd podczas archiwizacji oferty" });
        }
    }

    /// <summary>
    /// PATCH: api/Oferta/{id}/restore
    /// Przywraca zarchiwizowaną ofertę
    /// </summary>
    [HttpPatch("{id}/restore")]
    public async Task<IActionResult> RestoreOferta(uint id)
    {
        try
        {
            var success = await _ofertaService.RestoreOfertaAsync(id);
            
            if (!success)
                return NotFound(new { message = $"Nie znaleziono oferty o ID: {id}" });

            return Ok(new { message = "Oferta została przywrócona" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Błąd podczas przywracania oferty {IdOferta}", id);
            return StatusCode(500, new { message = "Wystąpił błąd podczas przywracania oferty" });
        }
    }
}
