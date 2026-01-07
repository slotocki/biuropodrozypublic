using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

// Upewnij się, że ta przestrzeń nazw pasuje do Twojego projektu
namespace BiuroTurystyczne1.Controllers; 

[ApiController]
[Route("api/[controller]")]
public class ProfileController : ControllerBase
{
    private readonly UserManager<IdentityUser> _userManager;

    public ProfileController(UserManager<IdentityUser> userManager)
    {
        _userManager = userManager;
    }

    [HttpGet]
    [Authorize] 
    public async Task<IActionResult> GetProfile()
    {
        var user = await _userManager.GetUserAsync(User);

        if (user == null)
        {
            return NotFound();
        }

        return Ok(new 
        { 
            email = user.Email,
            userName = user.UserName 
        });
    }
}