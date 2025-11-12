using Api.Contracts;
using Api.Data;
using Api.Domain;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Api.Controllers;

/// <summary>Query VW_BINSRECEIVED view.</summary>
[ApiController]
[Route("api/v{version:apiVersion}/[controller]")]
[ApiVersion("1.0")]
public class BinsReceivedController : ControllerBase
{
    private readonly AppDbContext _db;
    public BinsReceivedController(AppDbContext db) => _db = db;

    // GET /api/v1/BinsReceived?search=tag&skip=0&take=50&sourceDatabase=DM02
    // Note: If receiveDateFrom and receiveDateTo are not provided, defaults to last 30 days
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<BinsReceivedDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<BinsReceivedDto>>> List(
        [FromQuery] string? search,
        [FromQuery] string? sourceDatabase,
        [FromQuery] string? blockID,
        [FromQuery] string? poolID,
        [FromQuery] DateTime? receiveDateFrom,
        [FromQuery] DateTime? receiveDateTo,
        [FromQuery] int skip = 0,
        [FromQuery] int take = 50,
        CancellationToken ct = default)
    {
        take = Math.Clamp(take, 1, 500);

        IQueryable<BinsReceived> query = _db.BinsReceived.AsNoTracking();

        // Embedded date filter: default to last 30 days if no dates provided
        DateTime? actualDateFrom = receiveDateFrom;
        DateTime? actualDateTo = receiveDateTo;
        
        if (!actualDateFrom.HasValue && !actualDateTo.HasValue)
        {
            // Default to last 30 days if no dates provided
            actualDateFrom = DateTime.Today.AddDays(-30);
            actualDateTo = DateTime.Today.AddDays(1).AddTicks(-1); // End of today
        }
        else
        {
            // If only one date provided, use it
            if (!actualDateFrom.HasValue)
            {
                actualDateFrom = DateTime.MinValue;
            }
            if (!actualDateTo.HasValue)
            {
                actualDateTo = DateTime.MaxValue;
            }
        }

        query = query.Where(b => b.ReceiveDate != null && 
            b.ReceiveDate >= actualDateFrom.Value && 
            b.ReceiveDate <= actualDateTo.Value);

        if (!string.IsNullOrWhiteSpace(sourceDatabase))
        {
            query = query.Where(b => b.source_database == sourceDatabase);
        }

        if (!string.IsNullOrWhiteSpace(blockID))
        {
            query = query.Where(b => b.blockID == blockID);
        }

        if (!string.IsNullOrWhiteSpace(poolID))
        {
            query = query.Where(b => b.poolID == poolID);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(b =>
                (b.Commodity != null && b.Commodity.Contains(term)) ||
                (b.NAME != null && b.NAME.Contains(term)) ||
                (b.WHDesc != null && b.WHDesc.Contains(term)));
        }

        var rows = await query
            .OrderByDescending(b => b.ReceiveDate)
            .ThenBy(b => b.blockID)
            .Skip(skip)
            .Take(take)
            .Select(b => new BinsReceivedDto(
                b.source_database,
                b.Commodity,
                b.Style,
                b.WHDesc,
                b.blockID,
                b.NAME,
                b.ReceiveDate,
                b.RecvQnt,
                b.poolID))
            .ToListAsync(ct);

        return Ok(rows);
    }
}

