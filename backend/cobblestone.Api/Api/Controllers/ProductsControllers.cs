using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;


namespace Api.Controllers;


/// <summary>
/// Manage products.
/// </summary>
[ApiController]
[Route("api/v{version:apiVersion}/[controller]")]
[ApiVersion("1.0")]
public class ProductsController : ControllerBase
{
// In-memory stub data (replace with your DB/repository)
private static readonly List<ProductDto> _products = new()
{
new ProductDto { Id = 1, Sku = "APL-001", Name = "Apple", Price = 0.49m },
new ProductDto { Id = 2, Sku = "BAN-001", Name = "Banana", Price = 0.29m }
};


/// <summary>
/// List all products.
/// </summary>
[HttpGet]
[ProducesResponseType(typeof(IEnumerable<ProductDto>), StatusCodes.Status200OK)]
public ActionResult<IEnumerable<ProductDto>> GetAll()
=> Ok(_products);


/// <summary>
/// Get a product by ID.
/// </summary>
[HttpGet("{id:int}")]
[ProducesResponseType(typeof(ProductDto), StatusCodes.Status200OK)]
[ProducesResponseType(StatusCodes.Status404NotFound)]
public ActionResult<ProductDto> GetById(int id)
{
var prod = _products.FirstOrDefault(p => p.Id == id);
return prod is null ? NotFound() : Ok(prod);
}


    /// <summary>
    /// Create a new product.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ProductDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public ActionResult<ProductDto> Create(ProductCreateDto input)
    {
        if (string.IsNullOrWhiteSpace(input.Sku) || string.IsNullOrWhiteSpace(input.Name))
            return BadRequest("Sku and Name are required.");


        var nextId = _products.Any() ? _products.Max(p => p.Id) + 1 : 1;
        var prod = new ProductDto
        {
            Id = nextId,
            Sku = input.Sku,
            Name = input.Name,
            Price = input.Price
        };
        _products.Add(prod);
        return CreatedAtAction(nameof(GetById), new { id = prod.Id, version = "1" }, prod);
    }

/// <summary>
/// Update an existing product.
/// </summary>
[HttpPut("{id:int}")]
[ProducesResponseType(StatusCodes.Status204NoContent)]
[ProducesResponseType(StatusCodes.Status404NotFound)]
public IActionResult Update(int id, ProductUpdateDto input)
{
var prod = _products.FirstOrDefault(p => p.Id == id);
if (prod is null) return NotFound();
prod.Name = input.Name ?? prod.Name;
prod.Price = input.Price ?? prod.Price;
return NoContent();
}


/// <summary>
/// Delete a product.
/// </summary>
[HttpDelete("{id:int}")]
[ProducesResponseType(StatusCodes.Status204NoContent)]
[ProducesResponseType(StatusCodes.Status404NotFound)]
public IActionResult Delete(int id)
{
var prod = _products.FirstOrDefault(p => p.Id == id);
if (prod is null) return NotFound();
_products.Remove(prod);
return NoContent();
}
}


public record ProductDto
{
public int Id { get; init; }
public string Sku { get; init; } = string.Empty;
public string Name { get; set; } = string.Empty;
public decimal Price { get; set; }
}


public record ProductCreateDto
{
public string Sku { get; init; } = string.Empty;
public string Name { get; init; } = string.Empty;
public decimal Price { get; init; }
}


public record ProductUpdateDto
{
public string? Name { get; init; }
public decimal? Price { get; init; }
}