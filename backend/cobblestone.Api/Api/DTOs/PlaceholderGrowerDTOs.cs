using System.ComponentModel.DataAnnotations;

namespace Api.Contracts;

public record PlaceholderGrowerCreateDto(
    [param: Required] string grower_name,
    [param: Required] string commodity_name,
    string? notes = null
);

public record PlaceholderGrowerUpdateDto(
    string? grower_name,
    string? commodity_name,
    bool? is_active,
    string? notes
);

public record PlaceholderGrowerDto(
    Guid id,
    string grower_name,
    string commodity_name,
    DateTime created_at,
    DateTime? updated_at,
    bool is_active,
    string? notes
);
