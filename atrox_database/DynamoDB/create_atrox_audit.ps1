$ErrorActionPreference = "Stop"

$region = if ($env:AWS_REGION) { $env:AWS_REGION } else { "us-east-2" }
$tableName = "atrox-audit"

$null = aws dynamodb describe-table --table-name $tableName --region $region 2>$null
$tableExists = $LASTEXITCODE -eq 0

if (-not $tableExists) {
    aws dynamodb create-table `
        --table-name $tableName `
        --attribute-definitions AttributeName=auditId,AttributeType=S AttributeName=timestamp,AttributeType=S `
        --key-schema AttributeName=auditId,KeyType=HASH AttributeName=timestamp,KeyType=RANGE `
        --billing-mode PAY_PER_REQUEST `
        --region $region | Out-Null

    aws dynamodb wait table-exists --table-name $tableName --region $region
}

aws dynamodb update-time-to-live `
    --table-name $tableName `
    --time-to-live-specification Enabled=true,AttributeName=ttl `
    --region $region | Out-Null
