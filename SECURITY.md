# Security Policy

## Reporting Security Vulnerabilities

We take security seriously. If you discover a security vulnerability, please follow our responsible disclosure policy.

### Do NOT

- Open a public GitHub issue for security vulnerabilities
- Post details on social media or public forums
- Share vulnerability details without permission
- Attempt to exploit vulnerabilities in production

### Do

- Email security details to: `security@aligned-ai.dev` (if email not available, use GitHub private vulnerability report)
- Include detailed description of the vulnerability
- Provide proof of concept or steps to reproduce
- Allow reasonable time for response and remediation

### Response Timeline

- **Initial Response:** Within 48 hours
- **Assessment:** Within 5 business days
- **Patch Development:** Depends on severity (1-14 days)
- **Disclosure:** After patch is released, usually within 90 days

### Vulnerability Severity

We classify vulnerabilities using CVSS v3.1:

- **Critical (9.0+):** Requires immediate action, patch within 24-48 hours
- **High (7.0-8.9):** Patch within 1 week
- **Medium (4.0-6.9):** Patch within 2 weeks
- **Low (<4.0):** Patch with next release

## Security Best Practices

### For Users

- **Keep Software Updated:** Always use the latest version
- **Strong Passwords:** Use unique, complex passwords
- **Two-Factor Authentication:** Enable if available
- **Secure Connection:** Always use HTTPS, never HTTP
- **Report Abuse:** Report suspicious activity to support team
- **Data Privacy:** Don't share sensitive information in comments

### For Developers

#### Code Security
- Never commit secrets, API keys, or credentials
- Use environment variables for sensitive configuration
- Validate all user inputs
- Escape output to prevent XSS attacks
- Use parameterized queries to prevent SQL injection
- Implement CSRF protection on state-changing operations

#### Authentication & Authorization
- Use strong password hashing (bcrypt, scrypt)
- Implement proper session management
- Validate JWTs before accepting
- Implement rate limiting on auth endpoints
- Use HTTPS only for all sensitive operations
- Implement account lockout after failed attempts

#### Database Security
- Enable Row-Level Security (RLS) for all tables
- Follow principle of least privilege
- Encrypt sensitive data at rest
- Use SSL/TLS for all connections
- Regular backups with encryption
- Audit access and changes

#### API Security
- Validate all inputs
- Implement rate limiting
- Use CORS properly
- Add security headers (HSTS, CSP, X-Frame-Options)
- Log security events
- Monitor for suspicious activity

#### Dependency Management
```bash
# Check for vulnerabilities
pnpm audit

# Fix known vulnerabilities
pnpm audit --fix

# Keep dependencies updated
pnpm outdated
```

#### Error Handling
- Don't expose sensitive information in error messages
- Log detailed errors server-side only
- Return generic messages to clients
- Include request IDs for debugging

### Infrastructure Security

#### Environment Variables
- Never commit `.env` file
- Rotate credentials regularly
- Use strong, unique passwords for all services
- Store in secure vault in production
- Audit access to credentials
- Use placeholders in `.env.example`

#### Database
- Enable automatic backups
- Use strong passwords
- Enable encryption
- Restrict network access
- Regular security updates
- Audit logging enabled

#### Deployment
- Use HTTPS/TLS everywhere
- Enable CORS properly
- Set security headers
- Use firewalls and DDoS protection
- Regular security patches
- Monitor logs for attacks
- Incident response plan

## Security Checklist

Before deployment:

- [ ] No hardcoded secrets or API keys
- [ ] All inputs validated
- [ ] Output properly escaped
- [ ] Authentication enforced on protected routes
- [ ] RLS policies enabled on all tables
- [ ] HTTPS/TLS configured
- [ ] Security headers set
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Error messages sanitized
- [ ] Logging configured
- [ ] Monitoring enabled
- [ ] Backups tested
- [ ] Incident response plan reviewed
- [ ] Security audit completed

## Known Security Issues

### 2025-11-05
- API keys were exposed in `.env.example` (FIXED in current version)
  - Impact: Low - demo environment only
  - Status: Keys have been rotated
  - Fix: Replaced with placeholder values in `.env.example`

### Previous Issues
See [Security Audit Report](./docs/audits/SECURITY_AUDIT_AND_RECOMMENDATIONS.md) for historical security assessments.

## Security Updates

Subscribe to security updates:

1. Watch GitHub repository
2. Follow release notes
3. Check security advisories regularly
4. Update dependencies automatically with Dependabot

## OWASP Top 10 Coverage

Our security measures address OWASP Top 10:

1. **Broken Access Control** - RLS policies, authentication checks
2. **Cryptographic Failures** - HTTPS/TLS, password hashing
3. **Injection** - Input validation, parameterized queries
4. **Insecure Design** - Security by design principles
5. **Security Misconfiguration** - Security checklist, documentation
6. **Vulnerable Components** - Dependency audits, version management
7. **Auth Failures** - Strong auth, session management
8. **Data Integrity Failures** - Input validation, output encoding
9. **Logging & Monitoring Gaps** - Comprehensive logging
10. **SSRF** - Input validation, URL validation

## Compliance

### Standards
- OWASP Top 10
- NIST Cybersecurity Framework
- CWE Top 25

### Data Protection
- GDPR compliant (where applicable)
- Data encryption (in transit and at rest)
- Privacy-by-design principles
- Right to be forgotten implementation

## Bug Bounty

Currently, we do not have a formal bug bounty program. However, we greatly appreciate security research and will acknowledge researchers appropriately.

## Security Contact

- **Email:** security@aligned-ai.dev
- **GitHub:** Private vulnerability report via GitHub security advisory
- **Response Time:** Within 48 hours

## Acknowledgments

We appreciate the security community's help in keeping Aligned AI secure. See [ACKNOWLEDGMENTS.md](./docs/ACKNOWLEDGMENTS.md) for recognized researchers.

---

Last Updated: 2025-11-05
