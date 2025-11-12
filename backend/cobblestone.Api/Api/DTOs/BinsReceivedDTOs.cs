namespace Api.Contracts;

public record BinsReceivedDto(
    string source_database,
    string? Commodity,
    string? Style,
    string? WHDesc,
    string? blockID,
    string? NAME,
    DateTime? ReceiveDate,
    double? RecvQnt,
    string? poolID
);

