# PowerShell script to convert PNG to ICO with multiple resolutions
Add-Type -AssemblyName System.Drawing

$pngPath = "build\icon.png"
$icoPath = "build\icon.ico"

# Load the source image
$img = [System.Drawing.Image]::FromFile((Resolve-Path $pngPath))

# Create icon sizes
$sizes = @(16, 32, 48, 64, 128, 256)

# Create a memory stream for the ICO file
$memoryStream = New-Object System.IO.MemoryStream
$writer = New-Object System.IO.BinaryWriter($memoryStream)

# ICO header
$writer.Write([uint16]0)  # Reserved
$writer.Write([uint16]1)  # Type (1 = ICO)
$writer.Write([uint16]$sizes.Count)  # Number of images

$imageDataStreams = @()
$offset = 6 + ($sizes.Count * 16)  # Header + directory entries

foreach ($size in $sizes) {
    # Resize image
    $bitmap = New-Object System.Drawing.Bitmap($size, $size)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.DrawImage($img, 0, 0, $size, $size)
    $graphics.Dispose()
    
    # Save to PNG stream
    $imageStream = New-Object System.IO.MemoryStream
    $bitmap.Save($imageStream, [System.Drawing.Imaging.ImageFormat]::Png)
    $imageData = $imageStream.ToArray()
    $imageDataStreams += $imageData
    
    # Write directory entry (0 = 256 for width/height in ICO format)
    $width = if ($size -eq 256) { 0 } else { $size }
    $height = if ($size -eq 256) { 0 } else { $size }
    $writer.Write([byte]$width)  # Width (0 = 256)
    $writer.Write([byte]$height)  # Height (0 = 256)
    $writer.Write([byte]0)      # Color palette
    $writer.Write([byte]0)      # Reserved
    $writer.Write([uint16]1)    # Color planes
    $writer.Write([uint16]32)   # Bits per pixel
    $writer.Write([uint32]$imageData.Length)  # Size of image data
    $writer.Write([uint32]$offset)  # Offset to image data
    
    $offset += $imageData.Length
    
    $bitmap.Dispose()
    $imageStream.Dispose()
}

# Write image data
foreach ($imageData in $imageDataStreams) {
    $writer.Write($imageData)
}

# Save to file
$writer.Flush()
[System.IO.File]::WriteAllBytes((Resolve-Path .).Path + "\$icoPath", $memoryStream.ToArray())

$writer.Close()
$memoryStream.Close()
$img.Dispose()

Write-Host "ICO file created successfully at $icoPath"
