using Microsoft.EntityFrameworkCore;
using Api.Domain;

namespace Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Block> Blocks => Set<Block>();
    public DbSet<HarvestPlan> HarvestPlans => Set<HarvestPlan>();
    public DbSet<HarvestContractor> HarvestContractors => Set<HarvestContractor>();
    public DbSet<Pool> Pools => Set<Pool>();
    public DbSet<CommodityClass> Commodities => Set<CommodityClass>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<HarvestContractor>(b =>
        {
            b.ToTable("HarvestContractors", "dbo");   // <— change table name if different
            b.HasKey(x => x.id);
            b.Property(x => x.id).ValueGeneratedOnAdd();   // identity(bigint)

            b.Property(x => x.name)
                .IsRequired()
                .HasMaxLength(100)
                .IsUnicode(false); // varchar

            b.Property(x => x.primary_contact_name).HasMaxLength(50).IsUnicode(false);
            b.Property(x => x.primary_contact_phone).HasMaxLength(20).IsUnicode(false);
            b.Property(x => x.office_phone).HasMaxLength(20).IsUnicode(false);
            b.Property(x => x.mailing_address).HasMaxLength(100).IsUnicode(false);

            // bit columns map to bool/bool? automatically
        });

        modelBuilder.Entity<HarvestPlan>(b =>
        {
            b.ToTable("HarvestPlanEntry", "dbo"); // <- change if your table name differs
            b.HasKey(x => x.id);


            b.Property(x => x.grower_block_source_database)
            .IsRequired()
            .HasMaxLength(20)
            .IsUnicode(true);


            b.Property(x => x.deliver_to).HasMaxLength(30).IsUnicode(false);
            b.Property(x => x.packed_by).HasMaxLength(30).IsUnicode(false);
            b.Property(x => x.notes_general).IsUnicode(false); // varchar(MAX)


            // precise numeric types
            b.Property(x => x.harvesting_rate).HasColumnType("decimal(18,4)");
            b.Property(x => x.hauling_rate).HasColumnType("decimal(18,4)");
            b.Property(x => x.forklift_rate).HasColumnType("decimal(18,4)");


            // optional FKs (no relationships yet)
            b.Property(x => x.contractor_id);
            b.Property(x => x.hauler_id);
            b.Property(x => x.forklift_contractor_id);


            // If your column name is literally "date", map explicitly to avoid provider-specific issues
            b.Property(x => x.date).HasColumnName("date").HasColumnType("date");
        });
        modelBuilder.Entity<Pool>(b =>
        {
            b.ToTable("Pools", "dbo");
            b.HasKey(x => x.POOLIDX);

            b.Property(x => x.ID).HasMaxLength(12).IsUnicode(true);
            b.Property(x => x.DESCR).HasMaxLength(40).IsUnicode(true);

            b.Property(x => x.ICCLOSEDFLAG).HasMaxLength(1).IsFixedLength();
            b.Property(x => x.POOLTYPE).HasMaxLength(1).IsFixedLength();

            b.Property(x => x.source_database).HasMaxLength(20).IsUnicode(true);
            b.Property(x => x.SyncStatus).HasMaxLength(1).IsFixedLength().IsUnicode(true);

            b.Property(x => x.RowVer).IsRowVersion().IsConcurrencyToken();
        });
        modelBuilder.Entity<CommodityClass>(b =>
        {
            b.ToTable("Commodity", "dbo");
            b.Property(x => x.source_database);
            b.HasKey(x => x.CommodityIDx);

            b.Property(x => x.InvoiceCommodity).HasMaxLength(50).IsUnicode(true);
            b.Property(x => x.Commodity).HasMaxLength(50).IsUnicode(true);
        });
    }
}
