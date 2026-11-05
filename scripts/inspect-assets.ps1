param(
  [string]$InputPath = "public/assets",
  [string]$OutputPath = "docs/asset-inventory.json"
)

Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies "System.Drawing" -TypeDefinition @"
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Runtime.InteropServices;

public sealed class PngMetric
{
    public string File { get; set; }
    public int Width { get; set; }
    public int Height { get; set; }
    public bool HasAlphaChannel { get; set; }
    public long TransparentPixels { get; set; }
    public long SemiTransparentPixels { get; set; }
    public long OpaquePixels { get; set; }
    public int BboxX { get; set; }
    public int BboxY { get; set; }
    public int BboxWidth { get; set; }
    public int BboxHeight { get; set; }
}

public static class PngInspector
{
    public static PngMetric Inspect(string path, string relativePath)
    {
        using (var source = new Bitmap(path))
        using (var bitmap = new Bitmap(source.Width, source.Height, PixelFormat.Format32bppArgb))
        {
            using (var graphics = Graphics.FromImage(bitmap))
            {
                graphics.CompositingMode = System.Drawing.Drawing2D.CompositingMode.SourceCopy;
                graphics.Clear(Color.Transparent);
                graphics.DrawImage(
                    source,
                    new Rectangle(0, 0, source.Width, source.Height),
                    0,
                    0,
                    source.Width,
                    source.Height,
                    GraphicsUnit.Pixel
                );
            }

            var rectangle = new Rectangle(0, 0, bitmap.Width, bitmap.Height);
            var data = bitmap.LockBits(rectangle, ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
            try
            {
                var bytes = new byte[Math.Abs(data.Stride) * data.Height];
                Marshal.Copy(data.Scan0, bytes, 0, bytes.Length);
                long transparent = 0;
                long semiTransparent = 0;
                long opaque = 0;
                var minX = bitmap.Width;
                var minY = bitmap.Height;
                var maxX = -1;
                var maxY = -1;

                for (var y = 0; y < bitmap.Height; y++)
                {
                    var row = data.Stride >= 0 ? y * data.Stride : (bitmap.Height - 1 - y) * -data.Stride;
                    for (var x = 0; x < bitmap.Width; x++)
                    {
                        var alpha = bytes[row + x * 4 + 3];
                        if (alpha == 0)
                        {
                            transparent++;
                            continue;
                        }

                        if (alpha == 255) opaque++; else semiTransparent++;
                        if (x < minX) minX = x;
                        if (y < minY) minY = y;
                        if (x > maxX) maxX = x;
                        if (y > maxY) maxY = y;
                    }
                }

                return new PngMetric
                {
                    File = relativePath.Replace('\\', '/'),
                    Width = bitmap.Width,
                    Height = bitmap.Height,
                    HasAlphaChannel = transparent > 0 || semiTransparent > 0,
                    TransparentPixels = transparent,
                    SemiTransparentPixels = semiTransparent,
                    OpaquePixels = opaque,
                    BboxX = maxX < 0 ? 0 : minX,
                    BboxY = maxY < 0 ? 0 : minY,
                    BboxWidth = maxX < 0 ? 0 : maxX - minX + 1,
                    BboxHeight = maxY < 0 ? 0 : maxY - minY + 1
                };
            }
            finally
            {
                bitmap.UnlockBits(data);
            }
        }
    }
}
"@

$resolvedInput = (Resolve-Path $InputPath).Path
$metrics = Get-ChildItem $resolvedInput -Recurse -File -Filter "*.png" |
  Sort-Object FullName |
  ForEach-Object {
    $relative = $_.FullName.Substring($resolvedInput.Length).TrimStart([char]92)
    [PngInspector]::Inspect($_.FullName, $relative)
  }

$outputDirectory = Split-Path $OutputPath -Parent
if ($outputDirectory) {
  New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null
}
$metrics | ConvertTo-Json -Depth 3 | Set-Content -Encoding utf8 $OutputPath
$metrics
