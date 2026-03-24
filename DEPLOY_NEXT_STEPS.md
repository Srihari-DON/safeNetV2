# SafeNet MVP v2 - Final Publish Steps

Automated work already completed locally:
- Git repository initialized
- Baseline commit created
- Migration, DB check, seed, and build passed

## What still needs your account access

### 1) Create GitHub repository (one-time)
Create an empty repo named `safenet-mvp-v2` in your GitHub account.

### 2) Push this local code
Run in PowerShell:

```powershell
cd "c:\women empowerment\safenet-mvp-v2"
git remote set-url origin https://github.com/YOUR_USERNAME/safenet-mvp-v2.git 2>$null
git remote add origin https://github.com/YOUR_USERNAME/safenet-mvp-v2.git 2>$null
git push -u origin HEAD:main
```

### 3) Login to Vercel and deploy
```powershell
cd "c:\women empowerment\safenet-mvp-v2"
vercel login
vercel
```

### 4) Add environment variables in Vercel Project Settings
- DATABASE_URL
- DIRECT_URL
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY

Then redeploy:
```powershell
vercel --prod
```

### 5) Production sanity test
Check:
- /onboarding
- /portal
- /admin
- /ai-lab

Flow:
1. Register moderator in onboarding
2. Moderate one queue item in portal
3. Confirm admin metrics reflect activity

## If push or deploy fails
Share the exact terminal output and continue from there.
