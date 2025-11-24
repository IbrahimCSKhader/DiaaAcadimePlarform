# iOS PDF Viewer Implementation Guide

## Overview
This implementation provides a dual-mode PDF viewer:
- **iOS Devices (iPhone, iPad)**: Uses server-side image rendering (PNG/JPEG)
- **All Other Devices**: Uses PDF.js with full features

## Why This Approach?

### Problems with PDF.js on iOS:
1. **Memory Crashes**: iOS Safari has strict memory limits (~200-300MB)
2. **Rendering Failures**: PDF.js struggles with large PDFs on iOS
3. **Performance Issues**: Canvas rendering is slow on mobile Safari

### Solution:
- Convert PDF pages to images on the server
- Display images on iOS devices
- Prevent download/save functionality
- Maintain full PDF.js experience on desktop/Android

---

## Backend Implementation

### Endpoint 1: Get Page Count
```
GET /api/Summary/{id}/pages
```
**Response:**
```json
{
  "totalPages": 50
}
```

### Endpoint 2: Get Single Page Image
```
GET /api/Summary/{id}/pages?page={pageNumber}
```
**Response:** PNG image (binary)

### Endpoint 3: Get All Pages (Optional)
```
GET /api/Summary/{id}/pages/all?quality=85
```
**Response:**
```json
{
  "totalPages": 50,
  "pages": [
    {
      "pageNumber": 1,
      "image": "data:image/png;base64,...",
      "width": 612,
      "height": 792
    },
    ...
  ]
}
```

### Backend Code Location
See `Backend_PDF_To_Image_Endpoint.cs` for complete C# implementation.

**Required NuGet Packages:**
- `PdfSharp` OR `iTextSharp`
- `System.Drawing.Common` (for .NET Core)

**Key Settings:**
- DPI: 150 (good balance between quality and file size)
- Format: PNG (supports transparency)
- Quality: 85% (adjustable)

---

## Frontend Implementation

### iOS Detection
The code uses a comprehensive detection method:
```javascript
function isIOSDevice() {
    const ua = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(ua);
    const isSafari = /safari/.test(ua) && !/chrome|crios|fxios/.test(ua);
    const isIOSChrome = /crios/.test(ua);
    const isIOSFirefox = /fxios/.test(ua);
    const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isIOSPlatform = /iPad|iPhone|iPod/.test(navigator.platform) || 
                         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    return (isIOS || isIOSChrome || isIOSFirefox || isIOSPlatform) && hasTouchScreen;
}
```

### iOS Image Viewer Features

1. **Lazy Loading**: Only loads visible pages + adjacent pages
2. **Intersection Observer**: Automatically loads pages as user scrolls
3. **No Download**: Images are protected from download/save
4. **No PDF.js**: PDF.js library is NOT loaded for iOS devices

### Security Features (iOS Only)

1. **Disabled Context Menu**: Right-click/long-press disabled
2. **Disabled Text Selection**: Cannot select/copy text
3. **Disabled Image Save**: Images have `draggable="false"` and event handlers
4. **No PDF Download**: PDF file is never requested on iOS

### Code Structure

```javascript
if (IS_IOS) {
    // Image-based viewer
    loadPdfAsImages();
} else {
    // PDF.js viewer
    waitForPDFJS();
    initializePDFJSViewer();
}
```

---

## File Structure

```
├── view-pdf.html              # Main viewer (handles both modes)
├── Backend_PDF_To_Image_Endpoint.cs  # Backend endpoint code
└── iOS_PDF_Viewer_Implementation_Guide.md  # This file
```

---

## Testing Checklist

### iOS Devices
- [ ] iPhone Safari - Images load correctly
- [ ] iPad Safari - Images load correctly
- [ ] Cannot download PDF
- [ ] Cannot save images (long-press disabled)
- [ ] Cannot select text
- [ ] Navigation controls work
- [ ] Lazy loading works (scroll to see pages load)

### Non-iOS Devices
- [ ] Desktop browsers - PDF.js works normally
- [ ] Android Chrome - PDF.js works normally
- [ ] All PDF.js features available (drawing, zoom, etc.)
- [ ] Can download PDF (if needed)

---

## Performance Considerations

### Backend
- **Caching**: Consider caching converted images to avoid reprocessing
- **Compression**: Adjust quality parameter based on file size requirements
- **Rate Limiting**: Implement rate limiting for image endpoints

### Frontend (iOS)
- **Lazy Loading**: Only loads 3 pages initially, then loads on scroll
- **Image Optimization**: Uses blob URLs for efficient memory management
- **Cleanup**: Revokes blob URLs after images load

---

## Troubleshooting

### iOS Images Not Loading
1. Check backend endpoint is accessible
2. Verify CORS headers are set correctly
3. Check browser console for errors
4. Verify API returns correct content-type (image/png)

### Backend Conversion Fails
1. Check PDF file exists and is readable
2. Verify NuGet packages are installed
3. Check DPI settings (too high = memory issues)
4. Verify image format (PNG recommended)

### Detection Issues
1. Test with actual iOS device (simulators may differ)
2. Check user agent string
3. Verify touch detection works

---

## API Endpoints Summary

| Endpoint | Method | Purpose | iOS | Desktop |
|----------|--------|---------|-----|---------|
| `/api/Summary/{id}/file` | GET | Get PDF file | ❌ Not used | ✅ Used |
| `/api/Summary/{id}/pages` | GET | Get page count | ✅ Used | ❌ Not used |
| `/api/Summary/{id}/pages?page=N` | GET | Get page image | ✅ Used | ❌ Not used |

---

## Security Notes

1. **Authentication**: Add authentication to image endpoints
2. **Rate Limiting**: Prevent abuse of image conversion
3. **CORS**: Configure CORS properly for your domain
4. **Watermarking**: Consider adding watermarks to images if needed

---

## Future Enhancements

1. **Image Caching**: Cache converted images on server
2. **Progressive Loading**: Load lower quality first, then high quality
3. **Compression**: Use WebP format for smaller file sizes
4. **CDN**: Serve images from CDN for better performance

---

## Support

For issues or questions:
1. Check browser console for errors
2. Verify backend endpoints are working
3. Test on actual iOS device (not just simulator)
4. Check network tab for failed requests

