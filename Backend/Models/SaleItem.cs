namespace Backend.Models;

public class SaleItem
{
    public int Id { get; set; }
    public DateTime Date { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string AssetName { get; set; } = string.Empty;
    public string EnvatoLink { get; set; } = string.Empty;
    public decimal Price { get; set; }
}
