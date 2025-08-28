using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Api.Data;
using Api.Domain;

namespace Api.Controllers;

/// <summary>Read-only access to Pools.</summary>
[ApiController]
[Route("api/v{version:apiVersion}/[controller]")]
[ApiVersion("1.0")]
public class PoolsController : ControllerBase
{
    private readonly AppDbContext _db;
    public PoolsController(AppDbContext db) => _db = db;

    // GET: /api/v1/Pools?skip=0&take=100
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<Pool>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<Pool>>> List([FromQuery] int skip = 0, [FromQuery] int take = 100, CancellationToken ct = default)
    {
        take = Math.Clamp(take, 1, 500);

        var rows = await _db.Pools
            .AsNoTracking()
            .OrderBy(p => p.POOLIDX)
            .Skip(skip).Take(take)
            .ToListAsync(ct);

        return Ok(rows);
    }

    // GET: /api/v1/Pools/{id}
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(Pool), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<Pool>> Get(int id, CancellationToken ct)
    {
        var pool = await _db.Pools.AsNoTracking().FirstOrDefaultAsync(p => p.POOLIDX == id, ct);
        return pool is null ? NotFound() : Ok(pool);
    }
}
