using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SalesController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<SalesController> _logger;

    public SalesController(ApplicationDbContext context, ILogger<SalesController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // GET: api/sales
    [HttpGet]
    public async Task<ActionResult<IEnumerable<SaleItem>>> GetAllSales()
    {
        try
        {
            var sales = await _context.SaleItems
                .OrderByDescending(s => s.Date)
                .ToListAsync();
            return Ok(sales);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving sales");
            return StatusCode(500, "Internal server error");
        }
    }

    // POST: api/sales
    [HttpPost]
    public async Task<ActionResult<SaleItem>> AddSale([FromBody] SaleItem saleItem)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            _context.SaleItems.Add(saleItem);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetAllSales), new { id = saleItem.Id }, saleItem);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding sale");
            return StatusCode(500, "Internal server error");
        }
    }

    // POST: api/sales/bulk
    [HttpPost("bulk")]
    public async Task<ActionResult> BulkAddSales([FromBody] List<SaleItem> saleItems)
    {
        try
        {
            if (saleItems == null || !saleItems.Any())
            {
                return BadRequest("No sales data provided");
            }

            var successCount = 0;
            var failedCount = 0;
            var errors = new List<string>();

            foreach (var saleItem in saleItems)
            {
                // Validate each item
                if (string.IsNullOrWhiteSpace(saleItem.CustomerName) ||
                    string.IsNullOrWhiteSpace(saleItem.AssetName) ||
                    saleItem.Price <= 0)
                {
                    failedCount++;
                    errors.Add($"Invalid data for customer: {saleItem.CustomerName ?? "Unknown"}");
                    continue;
                }

                _context.SaleItems.Add(saleItem);
                successCount++;
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                imported = successCount,
                failed = failedCount,
                errors = errors
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error bulk adding sales");
            return StatusCode(500, "Internal server error");
        }
    }

    // PUT: api/sales/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateSale(int id, [FromBody] SaleItem saleItem)
    {
        if (id != saleItem.Id)
        {
            return BadRequest();
        }

        _context.Entry(saleItem).State = EntityState.Modified;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!_context.SaleItems.Any(e => e.Id == id))
            {
                return NotFound();
            }
            else
            {
                throw;
            }
        }

        return NoContent();
    }

    // DELETE: api/sales/all
    [HttpDelete("all")]
    public async Task<IActionResult> DeleteAllSales()
    {
        try
        {
            // Use raw SQL for efficiency, or remove range
            _context.SaleItems.RemoveRange(_context.SaleItems);
            await _context.SaveChangesAsync();
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting all sales");
            return StatusCode(500, "Internal server error");
        }
    }

    // DELETE: api/sales/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteSale(int id)
    {
        try
        {
            var saleItem = await _context.SaleItems.FindAsync(id);
            if (saleItem == null)
            {
                return NotFound();
            }

            _context.SaleItems.Remove(saleItem);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting sale with id {Id}", id);
            return StatusCode(500, "Internal server error");
        }
    }
}
