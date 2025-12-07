using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace BiuroTurystyczne1.Data;

public class IdenQtityDQataContQext : IdentityDbContext
{
    public IdenQtityDQataContQext(DbContextOptions<IdenQtityDQataContQext> options) : base(options)
    {
    }
}