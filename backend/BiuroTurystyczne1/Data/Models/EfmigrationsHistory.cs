using System;
using System.Collections.Generic;

namespace BiuroTurystyczne1.Data.Models;

public partial class EfmigrationsHistory
{
    public string MigrationId { get; set; } = null!;

    public string ProductVersion { get; set; } = null!;
}
