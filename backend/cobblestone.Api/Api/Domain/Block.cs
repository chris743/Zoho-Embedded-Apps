namespace Api.Domain;

public class Block
{
    // NOT NULL
    public string source_database { get; set; } = string.Empty; // nvarchar(20)
    public int GABLOCKIDX { get; set; }                          // int (key)

    // NULLABLES (per your table)
    public string? ID { get; set; }                              // nvarchar(12)
    public string? NAME { get; set; }                            // nvarchar(40)
    public string? BLOCKTYPE { get; set; }                       // char(1)
    public int? GROWERNAMEIDX { get; set; }                      // int
    public int? GROWERLOCATIONSEQ { get; set; }                  // int
    public string? GrowerName { get; set; }                      // nvarchar(40)
    public string? GrowerID { get; set; }                        // nvarchar(6)
    public int? GACLASSIDX { get; set; }                         // int
    public int? CMTYIDX { get; set; }                            // int
    public int? VARIETYIDX { get; set; }                         // int
    public string? CHARGETAGSFLAG { get; set; }                  // char(1)
    public double? ACRES { get; set; }                           // float -> double
    public string? INACTIVEFLAG { get; set; }                    // char(1)
    public int? NOTESCOUNT { get; set; }                         // int
    public decimal? ESTIMATEDBINS { get; set; }                  // numeric(10,2)
    public string? POOLREQUIREDFLAG { get; set; }                // char(1)
    public string? CTDESTTYPE { get; set; }                      // char(1)
    public int? PRICENAMEIDX { get; set; }                       // int
    public string? GASETLREPACKTYPE { get; set; }                // char(1)
    public string? DISTRICT { get; set; }                        // nvarchar(65)
    public string? CROPYEARDESCR { get; set; }                   // nvarchar(50)
    public double? LATITUDE { get; set; }                        // float -> double
    public double? LONGITUDE { get; set; }                       // float -> double
    public DateTime? SyncDateTime { get; set; }                  // datetime
    public string? SyncStatus { get; set; }                      // nvarchar(1)

    // rowversion/timestamp
    public byte[] RowVer { get; set; } = Array.Empty<byte>();
}
