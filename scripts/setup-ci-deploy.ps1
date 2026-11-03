# One-time setup so GitHub Actions can deploy to Azure Container Apps without a stored password.
#  1. a user-assigned managed identity in blogflow-rg
#  2. a federated credential that trusts only this repo's "production" environment (GitHub OIDC)
#  3. Contributor on blogflow-rg only (nothing else in the subscription)
#  4. the IDs and URLs the deploy job reads, as GitHub secrets and variables
# Requires: az logged in with Owner on the subscription, gh logged in to the repo's account.
param(
  [string]$Subscription = '44551360-2c42-4648-9832-13d0337ffea0',
  [string]$ResourceGroup = 'blogflow-rg',
  [string]$Repo = 'lakshitha-dev/RBT-month5',
  [string]$ApiUrl = 'https://blogflow-api.jollymeadow-32aadaf0.southeastasia.azurecontainerapps.io',
  [string]$WebUrl = 'https://blogflow-web.jollymeadow-32aadaf0.southeastasia.azurecontainerapps.io'
)

function Check($what) { if ($LASTEXITCODE -ne 0) { Write-Host "FAILED: $what" -ForegroundColor Red; exit 1 } else { Write-Host "ok: $what" -ForegroundColor Green } }

az account set --subscription $Subscription; Check 'select subscription'
$rgId = az group show -n $ResourceGroup --query id -o tsv; Check 'find resource group'

$id = az identity create -n blogflow-github-deploy -g $ResourceGroup --query '{clientId:clientId, principalId:principalId, tenantId:tenantId}' -o json | ConvertFrom-Json
Check 'managed identity blogflow-github-deploy'

# GitHub's OIDC subject names the repo by immutable IDs: repo:<owner>@<ownerId>/<repo>@<repoId>:environment:<env>
$gh = @(gh api "repos/$Repo" --jq '.owner.login, .owner.id, .name, .id')   # 4 lines; no quotes inside (PowerShell 5.1 strips them)
Check 'look up GitHub IDs'
$subject = "repo:$($gh[0])@$($gh[1])/$($gh[2])@$($gh[3]):environment:production"
Write-Host "   OIDC subject: $subject"

az identity federated-credential create -g $ResourceGroup --identity-name blogflow-github-deploy --name github-production `
  --issuer https://token.actions.githubusercontent.com --subject $subject `
  --audiences api://AzureADTokenExchange -o none
Check "trust GitHub OIDC for $subject"

# a new identity can take a few seconds to reach the directory
for ($i = 1; $i -le 6; $i++) {
  az role assignment create --assignee-object-id $id.principalId --assignee-principal-type ServicePrincipal --role Contributor --scope $rgId -o none 2>$null
  if ($LASTEXITCODE -eq 0) { break }
  Start-Sleep -Seconds 10
}
Check "Contributor on $ResourceGroup only"

gh secret set AZURE_CLIENT_ID -R $Repo -b $id.clientId; Check 'secret AZURE_CLIENT_ID'
gh secret set AZURE_TENANT_ID -R $Repo -b $id.tenantId; Check 'secret AZURE_TENANT_ID'
gh secret set AZURE_SUBSCRIPTION_ID -R $Repo -b $Subscription; Check 'secret AZURE_SUBSCRIPTION_ID'
gh variable set API_URL -R $Repo -b $ApiUrl; Check 'variable API_URL'
gh variable set FRONTEND_URL -R $Repo -b $WebUrl; Check 'variable FRONTEND_URL'

Write-Host "`nDone. Every push to main now tests, builds, deploys and smoke-tests production." -ForegroundColor Green
