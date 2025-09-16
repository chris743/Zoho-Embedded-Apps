namespace Api.Domain;

public class PlaceholderGrower
{
    public Guid id { get; set; } // uniqueidentifier (PK)
    public string grower_name { get; set; } = ""; // nvarchar(100)
    public string commodity_name { get; set; } = ""; // nvarchar(100)
    public DateTime created_at { get; set; } // datetime2
    public DateTime? updated_at { get; set; } // datetime2
    public bool is_active { get; set; } = true; // bit
    public string? notes { get; set; } // nvarchar(500)
}
