# Security Policy

## Supported Versions
Only the latest version of CrowdFlow AI is supported with security updates.

## Reporting a Vulnerability
If you discover a security vulnerability within this project, please report it via GitHub Issues for now. We will respond within 48 hours.

## Implemented Security Measures
- **API Rate Limiting**: All endpoints are rate-limited to prevent DoS.
- **Payload Limits**: POST requests are capped at 1MB.
- **Authentication**: Organizer endpoints require Bearer Auth.
- **Security Headers**: CSP, HSTS, and X-Frame-Options are enforced.
- **Input Sanitization**: All user-controlled inputs are sanitized before being processed by the backend or AI.
