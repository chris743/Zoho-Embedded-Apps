namespace Api.Domain;

public class HarvestContractor
{
    // NOT NULL
    public long id { get; set; }

    // NULLABLES (per your table)
    public string? name { get; set; }
    public string? primary_contact_name { get; set; }
    public string? primary_contact_phone { get; set; }
    public string? office_phone { get; set; }
    public string? mailing_address { get; set; }
    public bool? provides_trucking { get; set; }
    public bool? provides_picking { get; set; }
    public bool? provides_forklift { get; set; }
   
}
