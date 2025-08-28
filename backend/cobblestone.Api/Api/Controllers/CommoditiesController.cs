using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Api.Data;
using Api.Domain;

namespace Api.Controllers;

[ApiController]
[Route("api/v{version:apiVersion}/[controller]")]
[ApiVersion("1.0")]
public class CommoditiesController : ControllerBase
{
    private readonly AppDbContext _db;
    public CommoditiesController(AppDbContext db) => _db = db;

    /// <summary>
    /// Get top 1000 Blocks
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<CommodityClass>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<CommodityClass>>> Get(CancellationToken ct)
    {
        var commodities = await _db.Commodities
            .AsNoTracking()
            .Take(1000)
            .ToListAsync(ct);

        return Ok(commodities);
    }
}
