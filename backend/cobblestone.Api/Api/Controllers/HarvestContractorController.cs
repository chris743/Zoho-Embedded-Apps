using Api.Contracts;
using Api.Data;
using Api.Domain;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Api.Controllers;

/// <summary>Manage HarvestContractors.</summary>
[ApiController]
[Route("api/v{version:apiVersion}/[controller]")]
[ApiVersion("1.0")]
public class HarvestContractorsController : ControllerBase
{
    private readonly AppDbContext _db;
    public HarvestContractorsController(AppDbContext db) => _db = db;

    // GET /api/v1/HarvestContractors?search=acme&skip=0&take=50
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<HarvestContractorDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<HarvestContractorDto>>> List(
        [FromQuery] string? search,
        [FromQuery] int skip = 0,
        [FromQuery] int take = 50,
        CancellationToken ct = default)
    {
        take = Math.Clamp(take, 1, 500);

        var query = _db.HarvestContractors.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(c =>
                c.name.Contains(term) ||
                (c.primary_contact_name != null && c.primary_contact_name.Contains(term)));
        }

        var rows = await query
            .OrderBy(c => c.name)
            .Skip(skip)
            .Take(take)
            .Select(c => new HarvestContractorDto(
                c.id, c.name, c.primary_contact_name, c.primary_contact_phone, c.office_phone,
                c.mailing_address, c.provides_trucking, c.provides_picking, c.provides_forklift))
            .ToListAsync(ct);

        return Ok(rows);
    }

    // GET /api/v1/HarvestContractors/{id:long}
    [HttpGet("{id:long}")]
    [ProducesResponseType(typeof(HarvestContractorDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<HarvestContractorDto>> Get(long id, CancellationToken ct)
    {
        var c = await _db.HarvestContractors.AsNoTracking().FirstOrDefaultAsync(x => x.id == id, ct);
        if (c is null) return NotFound();

        return new HarvestContractorDto(
            c.id, c.name, c.primary_contact_name, c.primary_contact_phone, c.office_phone,
            c.mailing_address, c.provides_trucking, c.provides_picking, c.provides_forklift);
    }

    // POST /api/v1/HarvestContractors
    [HttpPost]
    [ProducesResponseType(typeof(HarvestContractorDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<HarvestContractorDto>> Create(HarvestContractorCreateDto input, CancellationToken ct)
    {
        if (!ModelState.IsValid) return ValidationProblem(ModelState);

        var entity = new HarvestContractor
        {
            name = input.name,
            primary_contact_name = input.primary_contact_name,
            primary_contact_phone = input.primary_contact_phone,
            office_phone = input.office_phone,
            mailing_address = input.mailing_address,
            provides_trucking = input.provides_trucking,
            provides_picking = input.provides_picking,
            provides_forklift = input.provides_forklift
        };

        _db.HarvestContractors.Add(entity);
        await _db.SaveChangesAsync(ct); // DB assigns identity id

        var dto = new HarvestContractorDto(
            entity.id, entity.name, entity.primary_contact_name, entity.primary_contact_phone,
            entity.office_phone, entity.mailing_address,
            entity.provides_trucking, entity.provides_picking, entity.provides_forklift);

        return CreatedAtAction(nameof(Get), new { id = entity.id, version = "1" }, dto);
    }

    // PUT /api/v1/HarvestContractors/{id:long}
    [HttpPut("{id:long}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(long id, HarvestContractorUpdateDto input, CancellationToken ct)
    {
        var c = await _db.HarvestContractors.FirstOrDefaultAsync(x => x.id == id, ct);
        if (c is null) return NotFound();

        if (!string.IsNullOrWhiteSpace(input.name)) c.name = input.name;
        c.primary_contact_name = input.primary_contact_name ?? c.primary_contact_name;
        c.primary_contact_phone = input.primary_contact_phone ?? c.primary_contact_phone;
        c.office_phone = input.office_phone ?? c.office_phone;
        c.mailing_address = input.mailing_address ?? c.mailing_address;
        c.provides_trucking = input.provides_trucking ?? c.provides_trucking;
        c.provides_picking = input.provides_picking ?? c.provides_picking;
        c.provides_forklift = input.provides_forklift ?? c.provides_forklift;

        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    // DELETE /api/v1/HarvestContractors/{id:long}
    [HttpDelete("{id:long}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(long id, CancellationToken ct)
    {
        var c = await _db.HarvestContractors.FirstOrDefaultAsync(x => x.id == id, ct);
        if (c is null) return NotFound();

        _db.HarvestContractors.Remove(c);
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }
}
