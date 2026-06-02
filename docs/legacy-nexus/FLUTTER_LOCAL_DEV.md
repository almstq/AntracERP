# Local Development

Antrac Nexus is source-clean for Firebase and Google Maps configuration. The app
does not keep live Firebase or Maps keys in tracked source files.

## Required Local Values

Set these in your PowerShell session before starting localhost:

```powershell
$env:GOOGLE_MAPS_API_KEY="your_maps_key"
$env:FIREBASE_API_KEY="your_firebase_web_api_key"
$env:FIREBASE_AUTH_DOMAIN="your_project.firebaseapp.com"
$env:FIREBASE_PROJECT_ID="your_project_id"
$env:FIREBASE_STORAGE_BUCKET="your_project.firebasestorage.app"
$env:FIREBASE_MESSAGING_SENDER_ID="your_sender_id"
$env:FIREBASE_APP_ID="your_web_app_id"
$env:GEMINI_API_KEY="your_gemini_key"
```

Optional:

```powershell
$env:API_BASE_URL=""
$env:LOG_LEVEL="info"
```

## Run Localhost

Use the local wrapper so `web/index.html` is patched only while Flutter is
running, then restored back to the placeholder when the process exits.

```powershell
cd "C:\Antrac Nexus\app"
.\scripts\run_local.ps1 -Port 8080
```

The app will be available at:

```text
http://localhost:8080/
```

## Direct Flutter Command

If you do not need Google Maps to render, you can run Flutter directly with
the same defines:

```powershell
flutter run -d chrome --web-port=8080 `
  --dart-define=GOOGLE_MAPS_API_KEY="$env:GOOGLE_MAPS_API_KEY" `
  --dart-define=FIREBASE_API_KEY="$env:FIREBASE_API_KEY" `
  --dart-define=FIREBASE_AUTH_DOMAIN="$env:FIREBASE_AUTH_DOMAIN" `
  --dart-define=FIREBASE_PROJECT_ID="$env:FIREBASE_PROJECT_ID" `
  --dart-define=FIREBASE_STORAGE_BUCKET="$env:FIREBASE_STORAGE_BUCKET" `
  --dart-define=FIREBASE_MESSAGING_SENDER_ID="$env:FIREBASE_MESSAGING_SENDER_ID" `
  --dart-define=FIREBASE_APP_ID="$env:FIREBASE_APP_ID" `
  --dart-define=GEMINI_API_KEY="$env:GEMINI_API_KEY" `
  --dart-define=API_BASE_URL="$env:API_BASE_URL" `
  --dart-define=LOG_LEVEL="$env:LOG_LEVEL"
```

## Security State

Current repository state: **DEBUG-SAFE**, not yet **PRODUCTION-SECURE**.

Reasons:

- Live keys are no longer stored directly in `firebase_options.dart` or
  `web/index.html`.
- Local and Vercel builds require environment injection.
- Production security still requires key rotation, Google Cloud key/domain
  restrictions, and Vercel environment verification before Finance data goes
  live.
