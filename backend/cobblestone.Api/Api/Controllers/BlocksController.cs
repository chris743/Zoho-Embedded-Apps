using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Api.Data;
using Api.Domain;

namespace Api.Controllers;

[ApiController]
[Route("api/v{version:apiVersion}/[controller]")]
[ApiVersion("1.0")]
public class BlocksController : ControllerBase
{
    private readonly AppDbContext _db;
    public BlocksController(AppDbContext db) => _db = db;

    /// <summary>
    /// Get top 1000 Blocks
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<Block>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<Block>>> Get(CancellationToken ct)
    {
        var blocks = await _db.Blocks
            .AsNoTracking()
            .Take(1000)
            .ToListAsync(ct);

        return Ok(blocks);
    }
}
