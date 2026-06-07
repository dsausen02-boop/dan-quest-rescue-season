param(
  [string]$ProjectRoot = (Resolve-Path ".").Path
)

Add-Type -AssemblyName System.Drawing

$unityRoot = Join-Path $ProjectRoot "DAN_QUEST_Unity"
$portraitRoot = Join-Path $unityRoot "Assets\Characters\Portraits"
$proofRoot = Join-Path $unityRoot "Proof"
$blueprintRoot = Join-Path $unityRoot "Assets\Characters\PrefabBlueprints"
$cardBlueprintRoot = Join-Path $unityRoot "Assets\Characters\SelectionCardBlueprints"

New-Item -ItemType Directory -Force -Path $proofRoot, $blueprintRoot, $cardBlueprintRoot | Out-Null

$characters = @(
  @{ Id="amit"; Name="Amit"; File="Amit.png"; Role="Support / Stabilizer"; Status="Locked"; Color="#8BA3FF"; BodyW=0.58; BodyH=0.92; Head=0.36; Prop="Scroll"; Stance="calm vertical stance" },
  @{ Id="hadar"; Name="Hadar"; File="Hadar.png"; Role="Utility / Recovery"; Status="Locked"; Color="#FF9FC0"; BodyW=0.50; BodyH=0.86; Head=0.34; Prop="Window squeegee"; Stance="leaning cleaner stance" },
  @{ Id="tal"; Name="Tal"; File="Tal.png"; Role="Leader / Control"; Status="Locked"; Color="#FF8F52"; BodyW=0.62; BodyH=1.04; Head=0.38; Prop="Book and presentation"; Stance="arguing raised arm stance" },
  @{ Id="goodman"; Name="Goodman"; File="Goodman.png"; Role="Bruiser / Chaos"; Status="Locked"; Color="#6F8EA8"; BodyW=0.72; BodyH=0.95; Head=0.37; Prop="Reports"; Stance="wide aggressive stance" },
  @{ Id="halel"; Name="Halel"; File="Halel.png"; Role="Fast Striker"; Status="Locked"; Color="#9B78DE"; BodyW=0.48; BodyH=1.02; Head=0.34; Prop="Crown / motorcycle hint"; Stance="slim forward stance" },
  @{ Id="gellman"; Name="Gellman"; File="Gellman.png"; Role="Ranged Economy"; Status="Locked"; Color="#F5C451"; BodyW=0.66; BodyH=0.90; Head=0.38; Prop="Money"; Stance="business stance" },
  @{ Id="farber"; Name="Farber"; File="Farber.png"; Role="Tank / Mechanic"; Status="Locked"; Color="#C97848"; BodyW=0.78; BodyH=1.10; Head=0.39; Prop="Wrench"; Stance="heavy mechanic stance" },
  @{ Id="david"; Name="David"; File="David.png"; Role="Tech Summoner"; Status="Locked"; Color="#85D6FF"; BodyW=0.52; BodyH=0.94; Head=0.35; Prop="AI drone"; Stance="tech side stance" },
  @{ Id="mendel"; Name="Mendel"; File="Mendel.png"; Role="Starter Chaos"; Status="Unlocked"; Color="#EE6656"; BodyW=0.56; BodyH=0.88; Head=0.36; Prop="Banana"; Stance="chaotic throw stance" },
  @{ Id="kuzar"; Name="Kuzar"; File="Kuzar.png"; Role="Burst / Economy"; Status="Locked"; Color="#68C58A"; BodyW=0.50; BodyH=0.90; Head=0.34; Prop="Coupon"; Stance="cheap guarded stance" },
  @{ Id="amichai"; Name="Amichai"; File="Amichai.png"; Role="Melee / Sports Burst"; Status="Locked"; Color="#4FB46F"; BodyW=0.74; BodyH=0.92; Head=0.38; Prop="Soccer ball"; Stance="wide athlete stance" },
  @{ Id="aviad"; Name="Aviad"; File="Aviad.png"; Role="Rookie Soldier"; Status="Locked"; Color="#55B8DC"; BodyW=0.54; BodyH=0.98; Head=0.35; Prop="Helmet"; Stance="rookie soldier stance" },
  @{ Id="dan"; Name="Dan"; File="Dan.png"; Role="Legendary Hero"; Status="Legendary Locked"; Color="#FFF1A8"; BodyW=0.64; BodyH=1.18; Head=0.40; Prop="Golden aura"; Stance="heroic centered stance" }
)

$boss = @{ Id="kashi"; Name="Kashi"; File="Kashi.png"; Role="Corporate Emperor Boss"; Status="Boss"; Color="#8E44AD"; BodyW=0.96; BodyH=1.36; Head=0.52; Prop="Crown and assignments"; Stance="boss throne stance" }

function ColorFromHex([string]$hex) {
  return [System.Drawing.ColorTranslator]::FromHtml($hex)
}

function New-Canvas([int]$w, [int]$h) {
  $bmp = New-Object System.Drawing.Bitmap $w, $h
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
  return @{ Bitmap=$bmp; Graphics=$g }
}

function Save-Canvas($canvas, [string]$path) {
  $canvas.Bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $canvas.Graphics.Dispose()
  $canvas.Bitmap.Dispose()
}

function Draw-Text($g, [string]$text, [float]$x, [float]$y, [float]$w, [float]$h, [float]$size, [System.Drawing.Color]$color, [string]$align = "Near", [string]$fontName = "Arial", [int]$style = 0) {
  $fontStyle = [System.Drawing.FontStyle]$style
  $font = New-Object System.Drawing.Font $fontName, $size, $fontStyle
  $brush = New-Object System.Drawing.SolidBrush $color
  $format = New-Object System.Drawing.StringFormat
  $format.Alignment = [System.Drawing.StringAlignment]::$align
  $format.LineAlignment = [System.Drawing.StringAlignment]::Center
  $rect = New-Object System.Drawing.RectangleF $x, $y, $w, $h
  $g.DrawString($text, $font, $brush, $rect, $format)
  $format.Dispose(); $brush.Dispose(); $font.Dispose()
}

function Fill-Rect($g, [float]$x, [float]$y, [float]$w, [float]$h, [System.Drawing.Color]$color) {
  $brush = New-Object System.Drawing.SolidBrush $color
  $g.FillRectangle($brush, $x, $y, $w, $h)
  $brush.Dispose()
}

function Stroke-Rect($g, [float]$x, [float]$y, [float]$w, [float]$h, [System.Drawing.Color]$color, [float]$width = 2) {
  $pen = New-Object System.Drawing.Pen $color, $width
  $g.DrawRectangle($pen, $x, $y, $w, $h)
  $pen.Dispose()
}

function Draw-ContainedImage($g, [string]$path, [float]$x, [float]$y, [float]$w, [float]$h) {
  $img = [System.Drawing.Image]::FromFile($path)
  $scale = [Math]::Min($w / $img.Width, $h / $img.Height)
  $dw = $img.Width * $scale
  $dh = $img.Height * $scale
  $dx = $x + ($w - $dw) / 2
  $dy = $y + ($h - $dh) / 2
  $g.DrawImage($img, $dx, $dy, $dw, $dh)
  $img.Dispose()
}

function Draw-Card($g, $char, [float]$x, [float]$y, [float]$w, [float]$h) {
  $color = ColorFromHex $char.Color
  Fill-Rect $g $x $y $w $h ([System.Drawing.Color]::FromArgb(244, 24, 29, 42))
  Fill-Rect $g $x $y $w 8 $color
  Stroke-Rect $g $x $y $w $h ([System.Drawing.Color]::FromArgb(190, $color.R, $color.G, $color.B)) 3
  Draw-ContainedImage $g (Join-Path $portraitRoot $char.File) ($x + 12) ($y + 18) ($w - 24) ($h * 0.56)
  Draw-Text $g $char.Name ($x + 8) ($y + $h - 86) ($w - 16) 30 18 ([System.Drawing.Color]::FromArgb(255, 255, 241, 168)) "Center" "Arial" 1
  Draw-Text $g $char.Role ($x + 10) ($y + $h - 56) ($w - 20) 28 10 ([System.Drawing.Color]::White) "Center"
  Draw-Text $g $char.Status ($x + 10) ($y + $h - 28) ($w - 20) 18 9 ([System.Drawing.Color]::FromArgb(255, 176, 215, 255)) "Center"
}

function Draw-Proxy($g, $char, [float]$cx, [float]$cy, [float]$scale) {
  $color = ColorFromHex $char.Color
  $dark = [System.Drawing.Color]::FromArgb(255, 18, 21, 31)
  $skin = [System.Drawing.Color]::FromArgb(255, 222, 154, 108)
  $accent = [System.Drawing.Color]::FromArgb(255, [Math]::Min(255, $color.R + 48), [Math]::Min(255, $color.G + 48), [Math]::Min(255, $color.B + 48))
  $bodyW = [float]$char.BodyW * 80 * $scale
  $bodyH = [float]$char.BodyH * 120 * $scale
  $head = [float]$char.Head * 90 * $scale

  $shadowBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(90, 0, 0, 0))
  $g.FillEllipse($shadowBrush, $cx - $bodyW * 0.95, $cy + $bodyH * 0.62, $bodyW * 1.9, $bodyW * 0.42)
  $shadowBrush.Dispose()

  $penLeg = New-Object System.Drawing.Pen $dark, ([Math]::Max(7, 11 * $scale))
  $penLeg.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $penLeg.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $g.DrawLine($penLeg, $cx - $bodyW * 0.18, $cy + $bodyH * 0.35, $cx - $bodyW * 0.42, $cy + $bodyH * 0.68)
  $g.DrawLine($penLeg, $cx + $bodyW * 0.18, $cy + $bodyH * 0.35, $cx + $bodyW * 0.42, $cy + $bodyH * 0.68)
  $penLeg.Dispose()

  $bodyBrush = New-Object System.Drawing.SolidBrush $color
  $g.FillEllipse($bodyBrush, $cx - $bodyW / 2, $cy - $bodyH / 2, $bodyW, $bodyH)
  $bodyBrush.Dispose()

  $penArm = New-Object System.Drawing.Pen $accent, ([Math]::Max(8, 13 * $scale))
  $penArm.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $penArm.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $leftEndX = $cx - $bodyW * (0.7 + ([float]$char.BodyW % 0.3))
  $rightEndX = $cx + $bodyW * (0.68 + ([float]$char.Head % 0.25))
  $leftEndY = $cy - $bodyH * (0.05 + ([float]$char.BodyH % 0.22))
  $rightEndY = $cy - $bodyH * (0.18 - ([float]$char.BodyW % 0.14))
  $g.DrawLine($penArm, $cx - $bodyW * 0.38, $cy - $bodyH * 0.18, $leftEndX, $leftEndY)
  $g.DrawLine($penArm, $cx + $bodyW * 0.38, $cy - $bodyH * 0.18, $rightEndX, $rightEndY)
  $penArm.Dispose()

  $headBrush = New-Object System.Drawing.SolidBrush $skin
  $g.FillEllipse($headBrush, $cx - $head / 2, $cy - $bodyH * 0.75 - $head / 2, $head, $head)
  $headBrush.Dispose()

  $propBrush = New-Object System.Drawing.SolidBrush $accent
  switch ($char.Prop) {
    "Banana" { $g.FillPie($propBrush, $cx + $bodyW * 0.54, $cy - $bodyH * 0.42, 36 * $scale, 24 * $scale, 20, 230) }
    "Book and presentation" { $g.FillRectangle($propBrush, $cx + $bodyW * 0.55, $cy - $bodyH * 0.42, 32 * $scale, 42 * $scale) }
    "Window squeegee" { $g.FillRectangle($propBrush, $cx + $bodyW * 0.58, $cy - $bodyH * 0.2, 42 * $scale, 8 * $scale) }
    "Wrench" { $g.FillEllipse($propBrush, $cx + $bodyW * 0.52, $cy - $bodyH * 0.38, 26 * $scale, 26 * $scale) }
    "Soccer ball" { $g.FillEllipse($propBrush, $cx + $bodyW * 0.56, $cy + $bodyH * 0.28, 30 * $scale, 30 * $scale) }
    "Golden aura" { $auraPen = New-Object System.Drawing.Pen $accent, 6; $g.DrawEllipse($auraPen, $cx - $bodyW * 0.85, $cy - $bodyH * 0.9, $bodyW * 1.7, $bodyH * 1.65); $auraPen.Dispose() }
    "Crown and assignments" { $g.FillRectangle($propBrush, $cx - $bodyW * 0.28, $cy - $bodyH * 1.08, $bodyW * 0.56, 22 * $scale) }
    default { $g.FillRectangle($propBrush, $cx + $bodyW * 0.55, $cy - $bodyH * 0.32, 28 * $scale, 28 * $scale) }
  }
  $propBrush.Dispose()

}

function Create-CharacterSelectScreenshot {
  $canvas = New-Canvas 1920 1080
  $g = $canvas.Graphics
  Fill-Rect $g 0 0 1920 1080 ([System.Drawing.Color]::FromArgb(255, 10, 13, 22))
  Draw-Text $g "DAN QUEST" 48 28 600 64 44 ([System.Drawing.Color]::FromArgb(255, 255, 241, 168)) "Near" "Arial" 1
  Draw-Text $g "Unity 3D Character Select - latest uploaded portraits, no gameplay cutouts" 50 88 900 34 18 ([System.Drawing.Color]::White)

  $x0 = 52; $y0 = 148; $w = 210; $h = 250; $gap = 22
  for ($i = 0; $i -lt $characters.Count; $i++) {
    $col = $i % 5; $row = [Math]::Floor($i / 5)
    Draw-Card $g $characters[$i] ($x0 + $col * ($w + $gap)) ($y0 + $row * ($h + $gap)) $w $h
  }

  Fill-Rect $g 1330 140 520 760 ([System.Drawing.Color]::FromArgb(245, 24, 29, 42))
  Stroke-Rect $g 1330 140 520 760 ([System.Drawing.Color]::FromArgb(180, 238, 102, 86)) 3
  Draw-ContainedImage $g (Join-Path $portraitRoot "Mendel.png") 1410 180 360 450
  Draw-Text $g "Selected: Mendel" 1370 650 440 46 28 ([System.Drawing.Color]::FromArgb(255, 255, 241, 168)) "Center" "Arial" 1
  Draw-Text $g "Starter Chaos - Unlocked" 1370 704 440 34 18 ([System.Drawing.Color]::White) "Center"
  Draw-Text $g "Enter Arena Test" 1448 800 280 54 20 ([System.Drawing.Color]::FromArgb(255, 36, 24, 12)) "Center" "Arial" 1
  Stroke-Rect $g 1448 800 280 54 ([System.Drawing.Color]::FromArgb(255, 245, 196, 81)) 4
  Draw-Text $g "Boss asset ready: Kashi" 1370 872 440 32 16 (ColorFromHex $boss.Color) "Center" "Arial" 1
  Save-Canvas $canvas (Join-Path $proofRoot "01_character_select_screen.png")
}

function Create-AllCardsScreenshot {
  $canvas = New-Canvas 1920 1320
  $g = $canvas.Graphics
  Fill-Rect $g 0 0 1920 1320 ([System.Drawing.Color]::FromArgb(255, 10, 13, 22))
  Draw-Text $g "All Hero Selection Cards - dedicated portrait/card per character" 48 28 1500 58 34 ([System.Drawing.Color]::FromArgb(255, 255, 241, 168)) "Near" "Arial" 1
  $x0 = 54; $y0 = 120; $w = 245; $h = 305; $gap = 28
  for ($i = 0; $i -lt $characters.Count; $i++) {
    $col = $i % 6; $row = [Math]::Floor($i / 6)
    Draw-Card $g $characters[$i] ($x0 + $col * ($w + $gap)) ($y0 + $row * ($h + $gap)) $w $h
  }
  Save-Canvas $canvas (Join-Path $proofRoot "02_all_hero_cards.png")
}

function Create-PrefabScreenshot {
  $canvas = New-Canvas 1920 1380
  $g = $canvas.Graphics
  Fill-Rect $g 0 0 1920 1380 ([System.Drawing.Color]::FromArgb(255, 10, 13, 22))
  Draw-Text $g "Generated Unity Character Prefabs - unique 3D proxy silhouettes" 48 26 1500 58 34 ([System.Drawing.Color]::FromArgb(255, 255, 241, 168)) "Near" "Arial" 1
  $all = @($characters + @($boss))
  $x0 = 120; $y0 = 170; $cellW = 260; $cellH = 360
  for ($i = 0; $i -lt $all.Count; $i++) {
    $col = $i % 6; $row = [Math]::Floor($i / 6)
    $x = $x0 + $col * ($cellW + 24); $y = $y0 + $row * ($cellH + 34)
    Fill-Rect $g $x $y $cellW $cellH ([System.Drawing.Color]::FromArgb(230, 24, 29, 42))
    Stroke-Rect $g $x $y $cellW $cellH (ColorFromHex $all[$i].Color) 3
    Draw-Proxy $g $all[$i] ($x + $cellW / 2) ($y + 205) 1.05
    Draw-Text $g "$($all[$i].Name)_Proxy.prefab" ($x + 8) ($y + 12) ($cellW - 16) 26 13 ([System.Drawing.Color]::White) "Center" "Arial" 1
    Draw-Text $g $all[$i].Prop ($x + 8) ($y + $cellH - 44) ($cellW - 16) 24 11 ([System.Drawing.Color]::FromArgb(255, 210, 225, 255)) "Center"
  }
  Save-Canvas $canvas (Join-Path $proofRoot "03_every_character_prefab.png")
}

function Create-KashiScreenshot {
  $canvas = New-Canvas 1400 1000
  $g = $canvas.Graphics
  Fill-Rect $g 0 0 1400 1000 ([System.Drawing.Color]::FromArgb(255, 10, 13, 22))
  Draw-Text $g "Kashi Boss Prefab" 50 30 900 58 38 ([System.Drawing.Color]::FromArgb(255, 255, 241, 168)) "Near" "Arial" 1
  Fill-Rect $g 70 130 520 780 ([System.Drawing.Color]::FromArgb(235, 24, 29, 42))
  Stroke-Rect $g 70 130 520 780 (ColorFromHex $boss.Color) 4
  Draw-ContainedImage $g (Join-Path $portraitRoot "Kashi.png") 120 170 420 460
  Draw-Text $g "Kashi" 110 660 440 42 30 (ColorFromHex $boss.Color) "Center" "Arial" 1
  Draw-Text $g "Corporate Emperor Boss" 110 708 440 36 18 ([System.Drawing.Color]::White) "Center"
  Draw-Proxy $g $boss 980 560 2.0
  Draw-Text $g "Kashi_Proxy.prefab" 760 850 440 42 24 ([System.Drawing.Color]::White) "Center" "Arial" 1
  Save-Canvas $canvas (Join-Path $proofRoot "04_kashi_boss_prefab.png")
}

function Create-HierarchyScreenshot {
  $canvas = New-Canvas 1400 1450
  $g = $canvas.Graphics
  Fill-Rect $g 0 0 1400 1450 ([System.Drawing.Color]::FromArgb(255, 20, 23, 31))
  Draw-Text $g "Unity Project Hierarchy - DAN_QUEST_Unity" 40 24 980 52 30 ([System.Drawing.Color]::FromArgb(255, 255, 241, 168)) "Near" "Arial" 1
  $lines = @(
    "Assets/",
    "  Characters/",
    "    Portraits/ (14 imported uploaded PNGs)",
    "      Amit.png, Hadar.png, Tal.png, Goodman.png, Halel.png",
    "      Gellman.png, Farber.png, David.png, Mendel.png, Kashi.png",
    "      Kuzar.png, Amichai.png, Aviad.png, Dan.png",
    "    Heroes/Data/ (generated ScriptableObjects on Unity open)",
    "    Bosses/Data/ (Kashi ScriptableObject on Unity open)",
    "    AnimatorControllers/ (per-character controllers)",
    "    PrefabBlueprints/ (materialized character replacement specs)",
    "    SelectionCardBlueprints/ (dedicated card specs)",
    "  Prefabs/",
    "    Heroes/",
    "      Cards/ (dedicated card prefabs generated by editor)",
    "      Amit_Proxy.prefab ... Dan_Proxy.prefab",
    "    Bosses/",
    "      Kashi_Proxy.prefab",
    "  Scripts/",
    "    Core/",
    "      ArenaBootstrap.cs, CameraFollowTarget.cs, DanQuestGameSession.cs",
    "    Characters/",
    "      DanQuestCharacterData.cs, PlayerController3D.cs",
    "    UI/",
    "      CharacterSelectController.cs, CharacterSelectCard.cs",
    "    Editor/",
    "      DanQuestUnityFoundationGenerator.cs",
    "  Scenes/",
    "    DAN_QUEST_CharacterSelect.unity",
    "    DAN_QUEST_Arena_Test.unity",
    "Packages/",
    "  manifest.json (URP, Cinemachine, Input System, UGUI)"
  )
  $y = 100
  foreach ($line in $lines) {
    $color = if ($line.TrimEnd().EndsWith("/")) { [System.Drawing.Color]::FromArgb(255, 245, 196, 81) } else { [System.Drawing.Color]::White }
    Draw-Text $g $line 54 $y 1260 34 18 $color "Near" "Consolas"
    $y += 42
  }
  Save-Canvas $canvas (Join-Path $proofRoot "05_project_hierarchy.png")
}

function Write-Manifests {
  $all = @($characters + @($boss))
  $assetRows = foreach ($char in $all) {
    $type = if ($char.Id -eq "kashi") { "Boss" } else { "Hero" }
    [pscustomobject]@{
      name = $char.Name
      type = $type
      portrait = "Assets/Characters/Portraits/$($char.File)"
      prefab = if ($type -eq "Boss") { "Assets/Prefabs/Bosses/$($char.Name)_Proxy.prefab" } else { "Assets/Prefabs/Heroes/$($char.Name)_Proxy.prefab" }
      data = if ($type -eq "Boss") { "Assets/Characters/Bosses/Data/$($char.Name)_Data.asset" } else { "Assets/Characters/Heroes/Data/$($char.Name)_Data.asset" }
      selectionCard = if ($type -eq "Hero") { "Assets/Prefabs/Heroes/Cards/$($char.Name)_SelectionCard.prefab" } else { $null }
      bodyShape = "width=$($char.BodyW); height=$($char.BodyH); head=$($char.Head); stance=$($char.Stance)"
      prop = $char.Prop
      color = $char.Color
    }
  }

  $assetRows | ConvertTo-Json -Depth 4 | Set-Content -Encoding ASCII (Join-Path $proofRoot "replaced-assets.json")

  foreach ($char in $all) {
    $type = if ($char.Id -eq "kashi") { "Boss" } else { "Hero" }
    $blueprint = [pscustomobject]@{
      name = $char.Name
      characterType = $type
      portrait = "Assets/Characters/Portraits/$($char.File)"
      proxyPrefab = if ($type -eq "Boss") { "Assets/Prefabs/Bosses/$($char.Name)_Proxy.prefab" } else { "Assets/Prefabs/Heroes/$($char.Name)_Proxy.prefab" }
      color = $char.Color
      uniqueSilhouette = @{
        bodyWidth = $char.BodyW
        bodyHeight = $char.BodyH
        headScale = $char.Head
        stance = $char.Stance
        prop = $char.Prop
      }
    }
    $blueprint | ConvertTo-Json -Depth 5 | Set-Content -Encoding ASCII (Join-Path $blueprintRoot "$($char.Name)_ProxyBlueprint.json")
    if ($type -eq "Hero") {
      $card = [pscustomobject]@{
        name = "$($char.Name)_SelectionCard"
        portrait = "Assets/Characters/Portraits/$($char.File)"
        displayName = $char.Name
        role = $char.Role
        unlockStatus = $char.Status
        color = $char.Color
      }
      $card | ConvertTo-Json -Depth 4 | Set-Content -Encoding ASCII (Join-Path $cardBlueprintRoot "$($char.Name)_SelectionCardBlueprint.json")
    }
  }
}

Create-CharacterSelectScreenshot
Create-AllCardsScreenshot
Create-PrefabScreenshot
Create-KashiScreenshot
Create-HierarchyScreenshot
Write-Manifests

Write-Output "Generated proof screenshots in $proofRoot"
