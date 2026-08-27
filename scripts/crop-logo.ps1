Add-Type -AssemblyName System.Drawing
$srcPath = Join-Path $PSScriptRoot "..\public\logo.png" | Resolve-Path
$img = [System.Drawing.Bitmap]::FromFile($srcPath)
$w = $img.Width
$h = $img.Height
$bg = $img.GetPixel(2, 2)
$minX = $w; $minY = $h; $maxX = 0; $maxY = 0
for ($y = 0; $y -lt $h; $y++) {
  for ($x = 0; $x -lt $w; $x++) {
    $c = $img.GetPixel($x, $y)
    $nearPaper = ($c.R -ge 232 -and $c.G -ge 224 -and $c.B -ge 210)
    if (-not $nearPaper) {
      if ($x -lt $minX) { $minX = $x }
      if ($y -lt $minY) { $minY = $y }
      if ($x -gt $maxX) { $maxX = $x }
      if ($y -gt $maxY) { $maxY = $y }
    }
  }
}
if ($maxX -lt $minX) { throw "No emblem pixels found" }
Write-Output "content box $minX,$minY -> $maxX,$maxY"
$pad = 18
$minX = [Math]::Max(0, $minX - $pad)
$minY = [Math]::Max(0, $minY - $pad)
$maxX = [Math]::Min($w - 1, $maxX + $pad)
$maxY = [Math]::Min($h - 1, $maxY + $pad)
$cw = $maxX - $minX + 1
$ch = $maxY - $minY + 1
$rect = New-Object System.Drawing.Rectangle $minX, $minY, $cw, $ch
$crop = $img.Clone($rect, $img.PixelFormat)
$tmp = Join-Path $env:TEMP "breakfast-logo-crop.png"
$crop.Save($tmp, [System.Drawing.Imaging.ImageFormat]::Png)
$img.Dispose()
$crop.Dispose()
Copy-Item -Force $tmp $srcPath
Write-Output "cropped $($w)x$h -> ${cw}x${ch} at $minX,$minY"
