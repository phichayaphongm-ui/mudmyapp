$env:VERCEL_PROJECT = "mudmyapp"

$vars = @{
    "NEXT_PUBLIC_SUPABASE_URL"    = "https://tmuhhvlfllmkqjqawhsv.supabase.co"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtdWhodmxmbGxta3FqcWF3aHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwODk5ODksImV4cCI6MjEwMzY2NTk4OX0.dUFWj9iVL3SiV-rxa-K47Zip4s2UVt8P4S47BOmUtTw"
    "NEXT_PUBLIC_APP_NAME"         = "Mudmy"
    "NEXT_PUBLIC_APP_URL"          = "https://mudmy.app"
    "NEXT_PUBLIC_ENABLE_ADMIN_PANEL" = "false"
    "NEXT_PUBLIC_ENABLE_ANALYTICS" = "true"
}

foreach ($key in $vars.Keys) {
    $value = $vars[$key]
    Write-Host "Setting $key ..."
    $value | npx vercel env add $key production --project mudmyapp --yes
    Write-Host "Done: $key"
}

Write-Host "`nAll environment variables set! Triggering redeploy..."
npx vercel redeploy mudmyapp-o41oyujkk-mudmy.vercel.app 2>&1
