using Microsoft.AspNetCore.Mvc;
using System.IO;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Linq;
using System;

namespace DiaaSubohAcademy.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SummaryController : ControllerBase
    {
        private readonly string _pdfStoragePath;
        private readonly string _convertedImagesPath;
        private readonly string _baseUrl;

        public SummaryController(IConfiguration configuration)
        {
            // Configure paths from appsettings.json or environment variables
            _pdfStoragePath = configuration["FileStorage:PdfPath"] ?? "wwwroot/pdfs";
            _convertedImagesPath = configuration["FileStorage:ConvertedImagesPath"] ?? "wwwroot/ConvertedPdfs";
            _baseUrl = configuration["BaseUrl"] ?? $"{Request.Scheme}://{Request.Host}";
            
            // Ensure directories exist
            Directory.CreateDirectory(_convertedImagesPath);
        }

        /// <summary>
        /// GET: api/Summary/{id}/image-pages
        /// Converts PDF pages to images and returns URLs
        /// </summary>
        [HttpGet("{id}/image-pages")]
        public async Task<IActionResult> GetPdfAsImages(int id)
        {
            try
            {
                // Get PDF file path
                var pdfPath = Path.Combine(_pdfStoragePath, $"{id}.pdf");
                
                if (!System.IO.File.Exists(pdfPath))
                {
                    return NotFound(new { error = "PDF file not found", id = id });
                }

                // Check if images already exist (caching)
                var convertedFolder = Path.Combine(_convertedImagesPath, id.ToString());
                var imageUrls = GetCachedImages(id, convertedFolder);

                if (imageUrls.Count > 0)
                {
                    // Return cached images
                    return Ok(new
                    {
                        id = id,
                        pages = imageUrls,
                        cached = true
                    });
                }

                // Convert PDF to images
                imageUrls = await ConvertPdfToImagesAsync(pdfPath, id, convertedFolder);

                if (imageUrls.Count == 0)
                {
                    return StatusCode(500, new { error = "Failed to convert PDF to images" });
                }

                return Ok(new
                {
                    id = id,
                    pages = imageUrls,
                    cached = false
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = $"Error processing PDF: {ex.Message}" });
            }
        }

        /// <summary>
        /// Check if images are already cached
        /// </summary>
        private List<string> GetCachedImages(int id, string folderPath)
        {
            var imageUrls = new List<string>();

            if (!Directory.Exists(folderPath))
            {
                return imageUrls;
            }

            // Get all image files in the folder, sorted by page number
            var imageFiles = Directory.GetFiles(folderPath, "page*.jpg")
                .Concat(Directory.GetFiles(folderPath, "page*.png"))
                .OrderBy(f => ExtractPageNumber(f))
                .ToList();

            foreach (var imageFile in imageFiles)
            {
                var fileName = Path.GetFileName(imageFile);
                var imageUrl = $"{_baseUrl}/ConvertedPdfs/{id}/{fileName}";
                imageUrls.Add(imageUrl);
            }

            return imageUrls;
        }

        /// <summary>
        /// Extract page number from filename (e.g., "page1.jpg" -> 1)
        /// </summary>
        private int ExtractPageNumber(string filePath)
        {
            var fileName = Path.GetFileNameWithoutExtension(filePath);
            if (fileName.StartsWith("page") && int.TryParse(fileName.Substring(4), out int pageNum))
            {
                return pageNum;
            }
            return 0;
        }

        /// <summary>
        /// Convert PDF pages to images using PdfiumViewer
        /// </summary>
        private async Task<List<string>> ConvertPdfToImagesAsync(string pdfPath, int summaryId, string outputFolder)
        {
            return await Task.Run(() =>
            {
                var imageUrls = new List<string>();

                try
                {
                    // Ensure output folder exists
                    Directory.CreateDirectory(outputFolder);

                    // Using PdfiumViewer (recommended for .NET)
                    using (var document = PdfiumViewer.PdfDocument.Load(pdfPath))
                    {
                        int pageCount = document.PageCount;

                        for (int pageIndex = 0; pageIndex < pageCount; pageIndex++)
                        {
                            // Render page to image
                            using (var image = document.Render(pageIndex, 150, 150, true)) // 150 DPI, render for printing
                            {
                                // Optimize image size for mobile (max width 1200px)
                                var optimizedImage = OptimizeImageForMobile(image, maxWidth: 1200);

                                // Save as JPEG (smaller file size than PNG)
                                var fileName = $"page{pageIndex + 1}.jpg";
                                var filePath = Path.Combine(outputFolder, fileName);

                                optimizedImage.Save(filePath, System.Drawing.Imaging.ImageFormat.Jpeg, 
                                    new System.Drawing.Imaging.EncoderParameters
                                    {
                                        Param = new[]
                                        {
                                            new System.Drawing.Imaging.EncoderParameter(
                                                System.Drawing.Imaging.Encoder.Quality, 85L)
                                        }
                                    });

                                // Build URL
                                var imageUrl = $"{_baseUrl}/ConvertedPdfs/{summaryId}/{fileName}";
                                imageUrls.Add(imageUrl);

                                optimizedImage.Dispose();
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    // Log error
                    Console.WriteLine($"Error converting PDF to images: {ex.Message}");
                    throw;
                }

                return imageUrls;
            });
        }

        /// <summary>
        /// Optimize image for mobile devices (reduce memory usage)
        /// </summary>
        private System.Drawing.Image OptimizeImageForMobile(System.Drawing.Image originalImage, int maxWidth)
        {
            // Calculate new dimensions
            int originalWidth = originalImage.Width;
            int originalHeight = originalImage.Height;

            if (originalWidth <= maxWidth)
            {
                return new System.Drawing.Bitmap(originalImage);
            }

            int newWidth = maxWidth;
            int newHeight = (int)((double)originalHeight * maxWidth / originalWidth);

            // Create optimized bitmap
            var optimized = new System.Drawing.Bitmap(newWidth, newHeight);
            using (var graphics = System.Drawing.Graphics.FromImage(optimized))
            {
                graphics.InterpolationMode = System.Drawing.Drawing2D.InterpolationMode.HighQualityBicubic;
                graphics.SmoothingMode = System.Drawing.Drawing2D.SmoothingMode.HighQuality;
                graphics.PixelOffsetMode = System.Drawing.Drawing2D.PixelOffsetMode.HighQuality;
                graphics.CompositingQuality = System.Drawing.Drawing2D.CompositingQuality.HighQuality;
                graphics.DrawImage(originalImage, 0, 0, newWidth, newHeight);
            }

            return optimized;
        }
    }
}

// ============================================
// ALTERNATIVE: Using iTextSharp + Ghostscript
// ============================================
/*
// If you prefer iTextSharp, use this alternative:

using iTextSharp.text.pdf;
using System.Drawing;
using System.Drawing.Imaging;

private async Task<List<string>> ConvertPdfToImages_iTextSharp(string pdfPath, int summaryId, string outputFolder)
{
    return await Task.Run(() =>
    {
        var imageUrls = new List<string>();

        using (var reader = new PdfReader(pdfPath))
        {
            int pageCount = reader.NumberOfPages;

            for (int pageNum = 1; pageNum <= pageCount; pageNum++)
            {
                // Render page using iTextSharp renderer
                // Note: This requires additional setup with renderer libraries
                // Consider using PdfiumViewer instead for easier implementation
            }
        }

        return imageUrls;
    });
}
*/

// ============================================
// ALTERNATIVE: Using SkiaSharp (Cross-platform)
// ============================================
/*
using SkiaSharp;

private async Task<List<string>> ConvertPdfToImages_SkiaSharp(string pdfPath, int summaryId, string outputFolder)
{
    return await Task.Run(() =>
    {
        var imageUrls = new List<string>();

        using (var stream = new FileStream(pdfPath, FileMode.Open, FileAccess.Read))
        using (var document = SKDocument.CreatePdf(stream))
        {
            // SkiaSharp PDF rendering
            // Implementation depends on your specific needs
        }

        return imageUrls;
    });
}
*/

// ============================================
// REQUIRED NuGet PACKAGES:
// ============================================
// Install-Package PdfiumViewer
// Install-Package System.Drawing.Common (for .NET Core/5+)
//
// OR
//
// Install-Package iTextSharp
// Install-Package Ghostscript.NET (if using Ghostscript)

// ============================================
// appsettings.json Configuration:
// ============================================
/*
{
  "FileStorage": {
    "PdfPath": "wwwroot/pdfs",
    "ConvertedImagesPath": "wwwroot/ConvertedPdfs"
  },
  "BaseUrl": "https://yourdomain.com"
}
*/

// ============================================
// Startup.cs Configuration:
// ============================================
/*
// Add static file serving for converted images
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(
        Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "ConvertedPdfs")),
    RequestPath = "/ConvertedPdfs"
});
*/

// ============================================
// NOTES:
// ============================================
// 1. DPI: 150 is optimal for mobile (balance between quality and file size)
// 2. Format: JPEG is smaller than PNG, good for mobile
// 3. Quality: 85% provides good quality with reasonable file size
// 4. Max Width: 1200px prevents memory issues on iOS
// 5. Caching: Images are cached to avoid reprocessing
// 6. Cleanup: Consider adding a cleanup job for old converted images

