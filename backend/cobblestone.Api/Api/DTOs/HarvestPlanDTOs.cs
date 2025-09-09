using System.ComponentModel.DataAnnotations;


namespace Api.Contracts;



public record HarvestPlanCreateDto(
    [param: Required] string grower_block_source_database,
    [param: Required] int grower_block_id,
    int? planned_bins,
    long? contractor_id,
    decimal? harvesting_rate,
    long? hauler_id,
    decimal? hauling_rate,
    long? forklift_contractor_id,
    decimal? forklift_rate,
    int? pool_id,
    string? notes_general,
    string? deliver_to,
    string? packed_by,
    DateTime? date,
    int? bins
);


public record HarvestPlanUpdateDto(
    string? grower_block_source_database,
    int? grower_block_id,
    int? planned_bins,
    long? contractor_id,
    decimal? harvesting_rate,
    long? hauler_id,
    decimal? hauling_rate,
    long? forklift_contractor_id,
    decimal? forklift_rate,
    int? pool_id,
    string? notes_general,
    string? deliver_to,
    string? packed_by,
    DateTime? date,
    int? bins
);
public record BlockDto(
    string id,
    string name,
    string blocktype,
    string growerName,
    string growerID,
    decimal acres,
    string? district,
    string? cropyeardescr,
    decimal latitude,
    decimal longitude
);

public record CommodityDto(
    string invoiceCommodity,
    string commodity
);

public record HarvestPlanDto(
    Guid id,
    string grower_block_source_database,
    int    grower_block_id,
    int?   planned_bins,
    long?  contractor_id,
    decimal? harvesting_rate,
    long?  hauler_id,
    decimal? hauling_rate,
    long?  forklift_contractor_id,
    decimal? forklift_rate,
    int?   pool_id,
    string? notes_general,
    string? deliver_to,
    string? packed_by,
    DateTime? date,
    int?   bins,
    BlockDto? block,
    CommodityDto? commodity
);