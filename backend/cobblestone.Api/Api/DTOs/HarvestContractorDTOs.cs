using System.ComponentModel.DataAnnotations;

namespace Api.Contracts;

public record HarvestContractorDto(
    long id,
    string name,
    string? primary_contact_name,
    string? primary_contact_phone,
    string? office_phone,
    string? mailing_address,
    bool? provides_trucking,
    bool? provides_picking,
    bool? provides_forklift,
    string? color
);

public record HarvestContractorCreateDto(
    [Required, MaxLength(100)] string name,
    [MaxLength(50)]  string? primary_contact_name,
    [MaxLength(20)]  string? primary_contact_phone,
    [MaxLength(20)]  string? office_phone,
    [MaxLength(100)] string? mailing_address,
    bool? provides_trucking,
    bool? provides_picking,
    bool? provides_forklift,
    [MaxLength(7)] string? color
);

public record HarvestContractorUpdateDto(
    [Required, MaxLength(100)] string name,
    [MaxLength(50)]  string? primary_contact_name,
    [MaxLength(20)]  string? primary_contact_phone,
    [MaxLength(20)]  string? office_phone,
    [MaxLength(100)] string? mailing_address,
    bool? provides_trucking,
    bool? provides_picking,
    bool? provides_forklift,
    [MaxLength(7)] string? color
);
