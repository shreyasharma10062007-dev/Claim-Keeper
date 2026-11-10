# ClaimKeeper Local Server (PowerShell & .NET HttpListener)
# Serves static assets and provides mock REST API endpoints

$port = 3000
$url = "http://localhost:$port/"
$baseDir = $PSScriptRoot

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($url)

try {
    $listener.Start()
    Write-Host ""
    Write-Host "==========================================================" -ForegroundColor Cyan
    Write-Host "  ClaimKeeper AI — Policy Versioning & Evidence Tool" -ForegroundColor Green
    Write-Host "  Server running at: $url" -ForegroundColor Yellow
    Write-Host "  Press Ctrl+C to stop the server" -ForegroundColor Gray
    Write-Host "==========================================================" -ForegroundColor Cyan
    Write-Host ""

    # Open default browser
    Start-Process $url

    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $path = $request.Url.LocalPath
        if ($path -eq "/" -or $path -eq "") {
            $path = "/index.html"
        }

        $localFilePath = Join-Path $baseDir $path.TrimStart('/')

        # Handle API Endpoints (Slide 5 architecture)
        if ($path.StartsWith("/api/")) {
            $response.ContentType = "application/json"
            $response.AddHeader("Access-Control-Allow-Origin", "*")
            $jsonResponse = '{"status":"ok","message":"ClaimKeeper API active"}'
            
            if ($path -eq "/api/health") {
                $jsonResponse = '{"service":"ClaimKeeper","version":"1.0","retrievalAdapter":"TinyFish","security":"Server-side URL validation active"}'
            }
            
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($jsonResponse)
            $response.ContentLength64 = $buffer.Length
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
            $response.Close()
            continue
        }

        # Static File Serving
        if (Test-Path $localFilePath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($localFilePath).ToLower()
            $contentType = switch ($ext) {
                ".html" { "text/html; charset=utf-8" }
                ".css"  { "text/css; charset=utf-8" }
                ".js"   { "application/javascript; charset=utf-8" }
                ".json" { "application/json; charset=utf-8" }
                ".png"  { "image/png" }
                ".svg"  { "image/svg+xml" }
                ".ico"  { "image/x-icon" }
                Default { "application/octet-stream" }
            }

            $response.ContentType = $contentType
            $bytes = [System.IO.File]::ReadAllBytes($localFilePath)
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            $response.Close()
            Write-Host "[200] $path" -ForegroundColor DarkGray
        } else {
            $response.StatusCode = 404
            $notFound = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            $response.OutputStream.Write($notFound, 0, $notFound.Length)
            $response.Close()
            Write-Host "[404] $path" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "Server stopped or encountered error: $_" -ForegroundColor Yellow
} finally {
    if ($listener.IsListening) {
        $listener.Stop()
    }
    $listener.Close()
}
