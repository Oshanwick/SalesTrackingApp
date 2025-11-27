namespace Backend.Models;

public class SummaryReport
{
    public decimal TotalRevenue { get; set; }
    public int TotalSales { get; set; }
    public decimal AverageRevenue { get; set; }
    public decimal HighestSale { get; set; }
    public decimal LowestSale { get; set; }
    public string TopCustomer { get; set; } = string.Empty;
    public string MostSoldType { get; set; } = string.Empty;
}

public class RevenueTrendPoint
{
    public DateTime Date { get; set; }
    public decimal Revenue { get; set; }
    public int SalesCount { get; set; }
}

public class SalesByType
{
    public string Type { get; set; } = string.Empty;
    public int Count { get; set; }
    public decimal Revenue { get; set; }
    public decimal Percentage { get; set; }
}

public class TopCustomer
{
    public string CustomerName { get; set; } = string.Empty;
    public int SalesCount { get; set; }
    public decimal TotalRevenue { get; set; }
}

public class MonthlyData
{
    public string Month { get; set; } = string.Empty;
    public int MonthNumber { get; set; }
    public decimal Revenue { get; set; }
    public int SalesCount { get; set; }
}
