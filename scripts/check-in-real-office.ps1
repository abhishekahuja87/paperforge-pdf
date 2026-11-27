<#
  Opens Excel, Word and PowerPoint files in the real Microsoft Office on this PC (needs Office installed; Windows only)
  and reports problems that browser checks miss:
  - Excel: the file opens; every formula is recalculated and any cell showing an error (#VALUE!, #REF!, #DIV/0! ...) is listed.
    Protected sheets are unprotected in memory only; files are opened read-only and never saved.
  - Word: the file opens; contents tables and page-number fields update; the page count is shown.
  - PowerPoint: the file opens; text that spills out of its box by more than 2 pt is listed.
  Usage: download the files from the makers into one folder, then
    powershell -ExecutionPolicy Bypass -File scripts/check-in-real-office.ps1 -Dir C:\path\to\folder
  Optional -Only "*invoice*" limits the files. Prints JSON, one entry per file.
#>
param([string]$Dir, [string]$Only = '*')
$ErrorActionPreference = 'Stop'
$results = @()

$xlsx = Get-ChildItem $Dir -Filter "$Only.xlsx" -ErrorAction SilentlyContinue
if ($xlsx) {
  $xl = New-Object -ComObject Excel.Application
  $xl.Visible = $false; $xl.DisplayAlerts = $false; $xl.ScreenUpdating = $false
  foreach ($f in $xlsx) {
    $r = [ordered]@{ file = $f.Name; ok = $false; note = '' }
    try {
      $wb = $xl.Workbooks.Open($f.FullName, 0, $true)
      $xl.CalculateFull()
      $errs = @(); $formulas = 0
      foreach ($ws in $wb.Worksheets) {
        if ($ws.ProtectContents) { try { $ws.Unprotect() } catch { $r.note += "cannot unprotect $($ws.Name); " } }
        $ur = $ws.UsedRange
        try { $fc = $ur.SpecialCells(-4123) } catch { $fc = $null }   # xlCellTypeFormulas
        if ($fc) {
          $formulas += $fc.Count
          try { $ec = $ur.SpecialCells(-4123, 16) } catch { $ec = $null }   # formulas giving errors
          if ($ec) { foreach ($c in $ec.Cells) { if ($errs.Count -lt 6) { $errs += "$($ws.Name)!$($c.Address($false,$false))=$($c.Text) [$($c.Formula)]" } }; $r.errorCount += $ec.Count }
        }
      }
      $r.sheets = $wb.Worksheets.Count; $r.formulas = $formulas; $r.errors = $errs
      $r.ok = ($errs.Count -eq 0)
      $wb.Close($false)
    } catch { $r.note = $_.Exception.Message }
    $results += [pscustomobject]$r
  }
  $xl.Quit(); [void][Runtime.InteropServices.Marshal]::ReleaseComObject($xl)
}

$docx = Get-ChildItem $Dir -Filter "$Only.docx" -ErrorAction SilentlyContinue
if ($docx) {
  $wd = New-Object -ComObject Word.Application
  $wd.Visible = $false; $wd.DisplayAlerts = 0
  foreach ($f in $docx) {
    $r = [ordered]@{ file = $f.Name; ok = $false; note = '' }
    try {
      # FileName, ConfirmConversions, ReadOnly, AddToRecentFiles, PasswordDocument, PasswordTemplate, Revert, WritePasswordDocument, WritePasswordTemplate, Format, Encoding, Visible, OpenAndRepair, DocumentDirection, NoEncodingDialog
      $doc = $wd.Documents.Open($f.FullName, $false, $true, $false, '', '', $false, '', '', 0, [Type]::Missing, $false, $false, 0, $true)
      $r.fieldsUpdateFailedAt = $doc.Fields.Update()   # 0 = every field updated
      $r.pages = $doc.ComputeStatistics(2)
      $r.tocs = $doc.TablesOfContents.Count
      $r.ok = ($r.fieldsUpdateFailedAt -eq 0)
      $doc.Close($false)
    } catch { $r.note = $_.Exception.Message }
    $results += [pscustomobject]$r
  }
  $wd.Quit(); [void][Runtime.InteropServices.Marshal]::ReleaseComObject($wd)
}

$pptx = Get-ChildItem $Dir -Filter "$Only.pptx" -ErrorAction SilentlyContinue
if ($pptx) {
  $pp = New-Object -ComObject PowerPoint.Application
  foreach ($f in $pptx) {
    $r = [ordered]@{ file = $f.Name; ok = $false; note = '' }
    try {
      $pres = $pp.Presentations.Open($f.FullName, -1, 0, 0)   # ReadOnly, Untitled no, WithWindow no
      $over = @()
      foreach ($s in $pres.Slides) {
        foreach ($sh in $s.Shapes) {
          if ($sh.HasTextFrame -and $sh.TextFrame.HasText) {
            $tr = $sh.TextFrame.TextRange
            $extra = $tr.BoundTop + $tr.BoundHeight - ($sh.Top + $sh.Height)
            if ($extra -gt 2 -and $over.Count -lt 6) { $over += "slide $($s.SlideIndex): '$($tr.Text.Substring(0,[Math]::Min(30,$tr.Text.Length)))' spills $([Math]::Round($extra)) pt" }
          }
        }
      }
      $r.slides = $pres.Slides.Count; $r.overflow = $over; $r.ok = ($over.Count -eq 0)
      $pres.Close()
    } catch { $r.note = $_.Exception.Message }
    $results += [pscustomobject]$r
  }
  $pp.Quit(); [void][Runtime.InteropServices.Marshal]::ReleaseComObject($pp)
}

$results | ConvertTo-Json -Depth 4
