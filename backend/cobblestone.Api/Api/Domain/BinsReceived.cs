namespace Api.Domain;

public class BinsReceived
{
    public int InventoryIdx { get; set; } // Keep for EF Core key, but not exposed in DTO
    public string source_database { get; set; } = string.Empty;
    public string? Commodity { get; set; }
    public string? Style { get; set; }
    public string? WHDesc { get; set; }
    public string? blockID { get; set; }
    public string? NAME { get; set; }
    public DateTime? ReceiveDate { get; set; }
    public double? RecvQnt { get; set; }
    public string? poolID { get; set; }
}
