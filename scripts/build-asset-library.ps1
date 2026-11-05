param(
  [string]$SourcePath = "",
  [string]$OutputPath = "public/assets/library"
)

Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies "System.Drawing" -TypeDefinition @"
using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;

public static class AssetVariantBuilder
{
    private static Bitmap LoadArgb(string path)
    {
        using (var source = new Bitmap(path))
        {
            var result = new Bitmap(source.Width, source.Height, PixelFormat.Format32bppArgb);
            result.SetResolution(96, 96);
            using (var graphics = Graphics.FromImage(result))
            {
                graphics.CompositingMode = CompositingMode.SourceCopy;
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
            return result;
        }
    }

    private static Color Blend(Color target, byte alpha)
    {
        return Color.FromArgb(alpha, target.R, target.G, target.B);
    }

    public static void BuildMonochrome(string sourcePath, string outputPath)
    {
        using (var source = LoadArgb(sourcePath))
        using (var output = new Bitmap(source.Width, source.Height, PixelFormat.Format32bppArgb))
        {
            var light = Color.FromArgb(215, 205, 245);
            var dark = Color.FromArgb(120, 100, 215);
            for (var y = 0; y < source.Height; y++)
            {
                for (var x = 0; x < source.Width; x++)
                {
                    var pixel = source.GetPixel(x, y);
                    if (pixel.A == 0)
                    {
                        output.SetPixel(x, y, Color.Transparent);
                        continue;
                    }

                    var luminance = pixel.R * 0.2126 + pixel.G * 0.7152 + pixel.B * 0.0722;
                    output.SetPixel(x, y, Blend(luminance < 110 ? dark : light, pixel.A));
                }
            }
            output.Save(outputPath, ImageFormat.Png);
        }
    }

    public static void BuildColoredPuzzle(string sourcePath, string outputPath)
    {
        using (var source = LoadArgb(sourcePath))
        using (var output = new Bitmap(source.Width, source.Height, PixelFormat.Format32bppArgb))
        {
            var yellow = Color.FromArgb(249, 236, 176);
            var pink = Color.FromArgb(249, 163, 170);
            var ink = Color.FromArgb(24, 24, 23);
            for (var y = 0; y < source.Height; y++)
            {
                for (var x = 0; x < source.Width; x++)
                {
                    var pixel = source.GetPixel(x, y);
                    if (pixel.A == 0)
                    {
                        output.SetPixel(x, y, Color.Transparent);
                        continue;
                    }

                    var luminance = pixel.R * 0.2126 + pixel.G * 0.7152 + pixel.B * 0.0722;
                    var seamX = source.Width * 0.86 - y * 1.48;
                    var target = luminance < 170 ? ink : (x < seamX ? yellow : pink);
                    output.SetPixel(x, y, Blend(target, pixel.A));
                }
            }
            output.Save(outputPath, ImageFormat.Png);
        }
    }

    public static void Resize(string sourcePath, string outputPath, double scale)
    {
        using (var source = new Bitmap(sourcePath))
        {
            var width = Math.Max(1, (int)Math.Round(source.Width * scale));
            var height = Math.Max(1, (int)Math.Round(source.Height * scale));
            using (var output = new Bitmap(width, height, PixelFormat.Format32bppArgb))
            {
                output.SetResolution(96, 96);
                using (var graphics = Graphics.FromImage(output))
                {
                    graphics.CompositingMode = CompositingMode.SourceCopy;
                    graphics.CompositingQuality = CompositingQuality.HighQuality;
                    graphics.InterpolationMode = InterpolationMode.HighQualityBicubic;
                    graphics.PixelOffsetMode = PixelOffsetMode.HighQuality;
                    graphics.SmoothingMode = SmoothingMode.HighQuality;
                    graphics.DrawImage(
                        source,
                        new Rectangle(0, 0, width, height),
                        0,
                        0,
                        source.Width,
                        source.Height,
                        GraphicsUnit.Pixel
                    );
                }
                output.Save(outputPath, ImageFormat.Png);
            }
        }
    }
}
"@

if ([string]::IsNullOrWhiteSpace($SourcePath)) {
  $sourceDirectory = Get-ChildItem "public/assets" -Directory |
    Where-Object { (Get-ChildItem $_.FullName -File -Filter "*.png").Count -eq 26 } |
    Select-Object -First 1
  if ($null -eq $sourceDirectory) {
    throw "Source directory with 26 customer PNG files was not found."
  }
  $SourcePath = $sourceDirectory.FullName
}

$resolvedSource = (Resolve-Path $SourcePath).Path
New-Item -ItemType Directory -Force -Path $OutputPath | Out-Null

$assets = @(
  @{ Id = "book"; Role = "main"; File = "codex-clipboard-1689d034-2781-44d1-9110-0792069545fe.png"; Derive = $false },
  @{ Id = "book"; Role = "background"; File = "codex-clipboard-1689d034-2781-44d1-9110-0792069545fe.png"; Derive = "mono" },
  @{ Id = "smartphone"; Role = "main"; File = "codex-clipboard-573148e2-5111-4f0e-897f-8a118b8859fb.png"; Derive = $false },
  @{ Id = "smartphone"; Role = "background"; File = "codex-clipboard-8a739162-2de5-4422-8399-2d7a1cb2dd51.png"; Derive = $false },
  @{ Id = "puzzle"; Role = "main"; File = "codex-clipboard-877e7dd4-f49b-469c-aca2-4a1ec15a545b.png"; Derive = "puzzle" },
  @{ Id = "puzzle"; Role = "background"; File = "codex-clipboard-877e7dd4-f49b-469c-aca2-4a1ec15a545b.png"; Derive = $false },
  @{ Id = "coin"; Role = "main"; File = "codex-clipboard-63d7df0b-dea4-4152-bf16-70d0ef32ca6d.png"; Derive = $false },
  @{ Id = "coin"; Role = "background"; File = "codex-clipboard-63d7df0b-dea4-4152-bf16-70d0ef32ca6d.png"; Derive = "mono" },
  @{ Id = "headphones"; Role = "main"; File = "codex-clipboard-02247e74-0c3d-427b-9128-6cfde7f0c48f.png"; Derive = $false },
  @{ Id = "headphones"; Role = "background"; File = "codex-clipboard-5b56e5ef-625f-4152-9d4b-6b7baca47e91.png"; Derive = $false },
  @{ Id = "lamp"; Role = "main"; File = "codex-clipboard-050bf256-549a-419a-a3a5-86d5d0e7290b.png"; Derive = $false },
  @{ Id = "lamp"; Role = "background"; File = "codex-clipboard-dd925581-d3ea-4f97-ad49-7883ca584500.png"; Derive = $false },
  @{ Id = "flowers"; Role = "main"; File = "codex-clipboard-e19a76ec-8f9d-4869-ab0f-b442701c4644.png"; Derive = $false },
  @{ Id = "flowers"; Role = "background"; File = "codex-clipboard-e76607ac-2358-4255-9c70-8461b9462b45.png"; Derive = $false },
  @{ Id = "wallet"; Role = "main"; File = "codex-clipboard-2f49e38f-cde1-4826-b9cb-af918677eedf.png"; Derive = $false },
  @{ Id = "wallet"; Role = "background"; File = "codex-clipboard-11f8e200-c967-4895-82da-33971b41650a.png"; Derive = $false },
  @{ Id = "folder"; Role = "main"; File = "codex-clipboard-0dc5d35d-a775-416b-96cd-f430687ef9e2.png"; Derive = $false },
  @{ Id = "folder"; Role = "background"; File = "codex-clipboard-64ca4496-d8d4-41ba-bbe0-e2bc39d0f1a6.png"; Derive = $false },
  @{ Id = "pen"; Role = "main"; File = "codex-clipboard-956eb99c-d690-4002-b00d-0f76087dbcdf.png"; Derive = $false },
  @{ Id = "pen"; Role = "background"; File = "codex-clipboard-6bf6255f-6889-4cfa-be8d-475f9cda0a7c.png"; Derive = $false }
)

foreach ($asset in $assets) {
  $source = Join-Path $resolvedSource $asset.File
  $large = Join-Path $OutputPath ($asset.Id + "-" + $asset.Role + "-l.png")
  $small = Join-Path $OutputPath ($asset.Id + "-" + $asset.Role + "-s.png")

  if ($asset.Derive -eq "mono") {
    [AssetVariantBuilder]::BuildMonochrome($source, $large)
  } elseif ($asset.Derive -eq "puzzle") {
    [AssetVariantBuilder]::BuildColoredPuzzle($source, $large)
  } else {
    Copy-Item -Force $source $large
  }

  [AssetVariantBuilder]::Resize($large, $small, 0.5)
}

Write-Output ("Built " + ($assets.Count * 2) + " canonical PNG variants in " + $OutputPath)
