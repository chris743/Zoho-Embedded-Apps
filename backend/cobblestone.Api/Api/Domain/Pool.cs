namespace Api.Domain;

public class Pool
{
    public int POOLIDX { get; set; }                        // PK
    public string? ID { get; set; }                         // nvarchar(12)
    public string? DESCR { get; set; }                      // nvarchar(40)
    public int? GACLASSIDX { get; set; }
    public int? GASETLGRPIDX { get; set; }
    public string? ICCLOSEDFLAG { get; set; }               // char(1)
    public string? POOLTYPE { get; set; }                   // char(1)
    public int? CMTYIDX { get; set; }
    public int? VARIETYIDX { get; set; }
    public DateTime? ICDATEFROM { get; set; }               // datetime2
    public DateTime? ICDATETHRU { get; set; }               // datetime2
    public int? DEPTIDX { get; set; }
    public int? COSTCENTERIDX { get; set; }
    public int? GARUNIDX { get; set; }
    public int? ADVRUNIDX { get; set; }
    public string source_database { get; set; } = string.Empty; // nvarchar(20), not null
    public DateTime? SyncDateTime { get; set; }             // datetime
    public string? SyncStatus { get; set; }                 // nvarchar(1)
    public byte[] RowVer { get; set; } = Array.Empty<byte>(); // timestamp/rowversion
}
