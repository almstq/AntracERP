Security Policy
Supported Versions
Antrac Nexus is under active private development. Security fixes are applied to
the current main branch only until formal release versioning is introduced.

Version / Branch	Supported
main	Yes
Production Vercel deployment	Yes
Local development builds	Best effort
Archived commits / old handovers	No
Reporting a Vulnerability
Please do not open public GitHub issues for security concerns.

Report suspected vulnerabilities privately to the project owner:

GitHub private vulnerability reporting, if enabled for this repository
Direct contact: repository owner / Antrac Nexus administrator
Include as much detail as possible:

Affected page, module, API route, or workflow
Steps to reproduce
Screenshots or logs, with secrets redacted
Whether the issue affects localhost, Vercel production, Firebase Auth,
Google Drive/Sheets, Google Maps, AI providers, or GitHub Actions
Response Expectations
The project maintainer will triage reported issues as follows:

Severity	Examples	Target Response
Critical	Exposed credentials, auth bypass, service-account leakage, finance data exposure	Same day
High	Role escalation, unauthorized data access, unsafe API proxy behavior	1-2 business days
Medium	Dependency vulnerability, limited information disclosure, workflow hardening issue	3-5 business days
Low	Documentation issue, low-risk configuration concern	Best effort
Accepted vulnerabilities will be fixed privately before public discussion.
Declined reports will receive a short explanation when possible.

Secrets And Credentials
Do not commit credentials, API keys, service-account files, OAuth client secret
downloads, .env files, or generated local config artifacts.

Required runtime values must be injected through:

Local environment variables and --dart-define
GitHub Actions repository secrets
Vercel environment variables
Known sensitive surfaces include:

Firebase configuration values
Google Maps API keys
Google Drive / Sheets service-account JSON
OpenAI, Gemini, and Groq API keys
Resend API keys
OAuth client secrets
If a secret is accidentally committed, rotate it immediately, restrict its
allowed APIs/domains, and close the GitHub secret scanning alert only after the
key is revoked or safely restricted.

Current Security Posture
Current repository state: DEBUG-SAFE, not yet PRODUCTION-SECURE.

Before treating Antrac Nexus as production-secure, the team must verify:

Exposed keys have been rotated or restricted in Google Cloud Console
Vercel environment variables are complete and scoped correctly
GitHub Actions secrets are configured for APK builds
Firebase Auth, Google OAuth origins, and API key restrictions match the
production domains
Secret scanning alerts are reviewed and resolved
