namespace Api.Domain;

public class CommodityClass
{
    // NOT NULL
    public string source_database { get; set; } = string.Empty; // nvarchar(20)
    public int CommodityIDx { get; set; }                          // int (key)

    // NULLABLES (per your table)
    public string? InvoiceCommodity { get; set; }                              // nvarchar(12)
    public string? Commodity { get; set; }                            // nvarchar(40)
    public DateTime? SyncDateTime { get; set; }                  // datetime
    public string? SyncStatus { get; set; }                      // nvarchar(1)

    // rowversion/timestamp
    public byte[] RowVer { get; set; } = Array.Empty<byte>();
}
