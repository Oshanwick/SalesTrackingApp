using Backend.Data;
using Backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReportsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public ReportsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("summary")]
    public async Task<ActionResult<SummaryReport>> GetSummary()
    {
        var sales = await _context.SaleItems.ToListAsync();

        if (!sales.Any())
        {
            return Ok(new SummaryReport
            {
                TotalRevenue = 0,
                TotalSales = 0,
                AverageRevenue = 0,
                HighestSale = 0,
                LowestSale = 0,
                TopCustomer = "N/A",
                MostSoldType = "N/A"
            });
        }

        var topCustomer = sales
            .GroupBy(s => s.CustomerName)
            .OrderByDescending(g => g.Sum(s => s.Price))
            .FirstOrDefault();

        var mostSoldType = sales
            .GroupBy(s => s.Type)
            .OrderByDescending(g => g.Count())
            .FirstOrDefault();

        return Ok(new SummaryReport
        {
            TotalRevenue = sales.Sum(s => s.Price),
            TotalSales = sales.Count,
            AverageRevenue = sales.Average(s => s.Price),
            HighestSale = sales.Max(s => s.Price),
            LowestSale = sales.Min(s => s.Price),
            TopCustomer = topCustomer?.Key ?? "N/A",
            MostSoldType = mostSoldType?.Key ?? "N/A"
        });
    }

    [HttpGet("revenue-trend")]
    public async Task<ActionResult<List<RevenueTrendPoint>>> GetRevenueTrend(
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate)
    {
        var query = _context.SaleItems.AsQueryable();

        // Default to last 30 days if no dates provided
        var end = endDate ?? DateTime.UtcNow;
        var start = startDate ?? end.AddDays(-30);

        query = query.Where(s => s.Date >= start && s.Date <= end);

        var sales = await query.ToListAsync();

        var trendData = sales
            .GroupBy(s => s.Date.Date)
            .Select(g => new RevenueTrendPoint
            {
                Date = g.Key,
                Revenue = g.Sum(s => s.Price),
                SalesCount = g.Count()
            })
            .OrderBy(t => t.Date)
            .ToList();

        return Ok(trendData);
    }

    [HttpGet("sales-by-type")]
    public async Task<ActionResult<List<SalesByType>>> GetSalesByType()
    {
        var sales = await _context.SaleItems.ToListAsync();

        if (!sales.Any())
        {
            return Ok(new List<SalesByType>());
        }

        var totalRevenue = sales.Sum(s => s.Price);

        var salesByType = sales
            .GroupBy(s => s.Type)
            .Select(g => new SalesByType
            {
                Type = g.Key,
                Count = g.Count(),
                Revenue = g.Sum(s => s.Price),
                Percentage = totalRevenue > 0 ? (g.Sum(s => s.Price) / totalRevenue * 100) : 0
            })
            .OrderByDescending(s => s.Revenue)
            .ToList();

        return Ok(salesByType);
    }

    [HttpGet("top-customers")]
    public async Task<ActionResult<List<TopCustomer>>> GetTopCustomers([FromQuery] int limit = 10)
    {
        var sales = await _context.SaleItems.ToListAsync();

        var topCustomers = sales
            .GroupBy(s => s.CustomerName)
            .Select(g => new TopCustomer
            {
                CustomerName = g.Key,
                SalesCount = g.Count(),
                TotalRevenue = g.Sum(s => s.Price)
            })
            .OrderByDescending(c => c.TotalRevenue)
            .Take(limit)
            .ToList();

        return Ok(topCustomers);
    }

    [HttpGet("monthly-comparison")]
    public async Task<ActionResult<List<MonthlyData>>> GetMonthlyComparison([FromQuery] int? year)
    {
        var targetYear = year ?? DateTime.UtcNow.Year;

        var sales = await _context.SaleItems
            .Where(s => s.Date.Year == targetYear)
            .ToListAsync();

        var monthlyData = sales
            .GroupBy(s => s.Date.Month)
            .Select(g => new MonthlyData
            {
                MonthNumber = g.Key,
                Month = new DateTime(targetYear, g.Key, 1).ToString("MMM"),
                Revenue = g.Sum(s => s.Price),
                SalesCount = g.Count()
            })
            .OrderBy(m => m.MonthNumber)
            .ToList();

        // Fill in missing months with zero data
        var allMonths = Enumerable.Range(1, 12)
            .Select(m => new MonthlyData
            {
                MonthNumber = m,
                Month = new DateTime(targetYear, m, 1).ToString("MMM"),
                Revenue = monthlyData.FirstOrDefault(md => md.MonthNumber == m)?.Revenue ?? 0,
                SalesCount = monthlyData.FirstOrDefault(md => md.MonthNumber == m)?.SalesCount ?? 0
            })
            .ToList();

        return Ok(allMonths);
    }
}
