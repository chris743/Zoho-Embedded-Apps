namespace Api.Domain;


public class HarvestPlan
{
// Required
public Guid id { get; set; } // uniqueidentifier (PK)
public string grower_block_source_database { get; set; } = ""; // nvarchar(20)
public int grower_block_id { get; set; } // int (FK later)


// Optionals (Allow Nulls checked in your screenshot)
public int? planned_bins { get; set; } // int
public long? contractor_id { get; set; } // bigint (FK later)
public decimal? harvesting_rate { get; set; } // decimal(18,4)
public long? hauler_id { get; set; } // bigint (FK later)
public decimal? hauling_rate { get; set; } // decimal(18,4)
public long? forklift_contractor_id { get; set; } // bigint (FK later)
public decimal? forklift_rate { get; set; } // decimal(18,4)
public int? pool_id { get; set; } // int (FK later)
public string? notes_general { get; set; } // varchar(MAX)
public string? deliver_to { get; set; } // varchar(30)
public string? packed_by { get; set; } // varchar(30)
public DateTime? date { get; set; } // date
public int? bins { get; set; } // int
}