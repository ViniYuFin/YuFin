# Script para criar conta admin
# Execute este arquivo no PowerShell

$uri = "http://localhost:3001/setup-admin"
$body = @{
    email = "administrador@yufin.com"
    password = "Admin123!"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $uri -Method POST -ContentType "application/json" -Body $body
    Write-Host "✅ Sucesso!" -ForegroundColor Green
    Write-Host "Conta admin criada:" -ForegroundColor Cyan
    Write-Host "Email: $($response.email)" -ForegroundColor Yellow
    Write-Host "Role: $($response.role)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Agora você pode fazer login em http://localhost:5174" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Verifique se o backend está rodando em http://localhost:3001" -ForegroundColor Yellow
}

