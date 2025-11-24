// ============================================
// BACKEND ENDPOINT: PDF to Image Converter
// ============================================
// This endpoint converts PDF pages to images for iOS devices
// Add this to your .NET API Controller

using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using PdfSharp.Pdf;
using PdfSharp.Drawing;
using System.Drawing;
using System.Drawing.Imaging;
using System.Collections.Generic;

namespace DiaaSubohAcademy.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SummaryController : ControllerBase
    {
        // Existing endpoints...
        
        /// <summary>
        /// Get PDF pages as images (for iOS devices)
        /// GET: api/Summary/{id}/pages
        /// </summary>
        [HttpGet("{id}/pages")]
        public async Task<IActionResult> GetPdfPagesAsImages(int id, [FromQuery] int? page = null)
        {
            try
            {
                // Get PDF file path (adjust based on your storage method)
                var pdfPath = GetPdfFilePath(id);
                if (!System.IO.File.Exists(pdfPath))
                {
                    return NotFound("PDF file not found");
                }

                // If specific page requested, return single page
                if (page.HasValue)
                {
                    var imageBytes = await ConvertPdfPageToImage(pdfPath, page.Value);
                    if (imageBytes == null)
                    {
                        return NotFound($"Page {page.Value} not found");
                    }
                    return File(imageBytes, "image/png");
                }

                // Otherwise, return metadata about all pages
                var pageCount = GetPdfPageCount(pdfPath);
                return Ok(new { totalPages = pageCount });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error converting PDF: {ex.Message}");
            }
        }

        /// <summary>
        /// Alternative: Get all pages info at once
        /// GET: api/Summary/{id}/pages/all
        /// Returns JSON with base64 encoded images or URLs
        /// </summary>
        [HttpGet("{id}/pages/all")]
        public async Task<IActionResult> GetAllPdfPagesAsImages(int id, [FromQuery] int quality = 85)
        {
            try
            {
                var pdfPath = GetPdfFilePath(id);
                if (!System.IO.File.Exists(pdfPath))
                {
                    return NotFound("PDF file not found");
                }

                var pageCount = GetPdfPageCount(pdfPath);
                var pages = new List<object>();

                for (int i = 1; i <= pageCount; i++)
                {
                    var imageBytes = await ConvertPdfPageToImage(pdfPath, i, quality);
                    if (imageBytes != null)
                    {
                        var base64 = Convert.ToBase64String(imageBytes);
                        pages.Add(new
                        {
                            pageNumber = i,
                            image = $"data:image/png;base64,{base64}",
                            width = 0, // You can extract dimensions if needed
                            height = 0
                        });
                    }
                }

                return Ok(new { totalPages = pageCount, pages = pages });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error converting PDF: {ex.Message}");
            }
        }

        // Helper Methods

        private string GetPdfFilePath(int id)
        {
            // Adjust this based on your file storage implementation
            // Example: return Path.Combine(_fileStoragePath, $"{id}.pdf");
            return $"path/to/pdf/{id}.pdf";
        }

        private int GetPdfPageCount(string pdfPath)
        {
            using (var document = PdfDocument.Open(pdfPath))
            {
                return document.PageCount;
            }
        }

        private async Task<byte[]> ConvertPdfPageToImage(string pdfPath, int pageNumber, int quality = 85)
        {
            return await Task.Run(() =>
            {
                try
                {
                    using (var document = PdfDocument.Open(pdfPath))
                    {
                        if (pageNumber < 1 || pageNumber > document.PageCount)
                        {
                            return null;
                        }

                        var pdfPage = document.Pages[pageNumber - 1];
                        
                        // Calculate dimensions (adjust DPI as needed)
                        int dpi = 150; // Good balance between quality and file size
                        double width = pdfPage.Width.Point;
                        double height = pdfPage.Height.Point;
                        
                        int imageWidth = (int)(width * dpi / 72.0);
                        int imageHeight = (int)(height * dpi / 72.0);

                        // Create bitmap
                        using (var bitmap = new Bitmap(imageWidth, imageHeight))
                        {
                            bitmap.SetResolution(dpi, dpi);
                            
                            using (var graphics = Graphics.FromImage(bitmap))
                            {
                                graphics.Clear(Color.White);
                                graphics.SmoothingMode = System.Drawing.Drawing2D.SmoothingMode.AntiAlias;
                                graphics.InterpolationMode = System.Drawing.Drawing2D.InterpolationMode.HighQualityBicubic;
                                
                                // Render PDF page to graphics
                                var xGraphics = XGraphics.FromGraphics(graphics, new XSize(width, height));
                                pdfPage.Render(xGraphics);
                            }

                            // Convert to PNG bytes
                            using (var ms = new MemoryStream())
                            {
                                var encoder = ImageCodecInfo.GetImageEncoders()
                                    .FirstOrDefault(c => c.FormatID == ImageFormat.Png.Guid);
                                
                                var encoderParams = new EncoderParameters(1);
                                encoderParams.Param[0] = new EncoderParameter(Encoder.Quality, quality);
                                
                                bitmap.Save(ms, ImageFormat.Png);
                                return ms.ToArray();
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    // Log error
                    Console.WriteLine($"Error converting page {pageNumber}: {ex.Message}");
                    return null;
                }
            });
        }
    }
}

// ============================================
// ALTERNATIVE: Using iTextSharp or PdfSharp
// ============================================
// If you're using iTextSharp, here's an alternative implementation:

/*
using iTextSharp.text.pdf;
using System.Drawing;
using System.Drawing.Imaging;

private async Task<byte[]> ConvertPdfPageToImage_iTextSharp(string pdfPath, int pageNumber)
{
    return await Task.Run(() =>
    {
        using (var reader = new PdfReader(pdfPath))
        {
            if (pageNumber < 1 || pageNumber > reader.NumberOfPages)
                return null;

            var pdfPage = reader.GetPageN(pageNumber);
            var rect = pdfPage.GetAsArray(PdfName.CROPBOX);
            
            int width = (int)reader.GetPageSize(pageNumber).Width;
            int height = (int)reader.GetPageSize(pageNumber).Height;
            
            using (var bitmap = new Bitmap(width, height))
            {
                using (var graphics = Graphics.FromImage(bitmap))
                {
                    graphics.Clear(Color.White);
                    // Render PDF using iTextSharp renderer
                }
                
                using (var ms = new MemoryStream())
                {
                    bitmap.Save(ms, ImageFormat.Png);
                    return ms.ToArray();
                }
            }
        }
    });
}
*/

// ============================================
// REQUIRED NuGet PACKAGES:
// ============================================
// Install-Package PdfSharp
// OR
// Install-Package iTextSharp
// Install-Package System.Drawing.Common (for .NET Core)

// ============================================
// NOTES:
// ============================================
// 1. Adjust DPI based on your needs (150 DPI is good for mobile)
// 2. Consider caching converted images to avoid reprocessing
// 3. Adjust quality parameter based on file size requirements
// 4. You may want to add authentication/authorization checks
// 5. Consider rate limiting for this endpoint

