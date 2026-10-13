---
name: file-upload-security
description: Use when implementing Multer middleware, validating documents and screenshot attachments, handling temporary files or upload security tests.
---

# file-upload-security

## Procedure
1. Define Multer config under `server/src/middleware/upload.ts`: exact fields `cv` (1), `paymentScreenshot` (1), `passportCopy` (0–1), `photo` (0–1); per-file max `MAX_FILE_MB` default 5, bounded multipart field size/number and total request bytes.
2. Prefer memory storage for small total files or private unpredictable temp dir outside public tree; never trust extensions alone; limit filename length and normalize to a safe attachment filename.
3. Validate claimed MIME plus bytes: `%PDF-` PDF; JPEG `FF D8 FF`; PNG magic signature and well-formed chunks; DOC Compound File Binary magic `D0 CF 11 E0 A1 B1 1A E1`; DOCX ZIP container must include expected OOXML `[Content_Types].xml` and `word/document.xml` entries using a secure approved parser, not ZIP signature alone.
4. Enforce allowed documents per field; screenshots JPEG/PNG only; photo/passport as specified. Reject mismatches, truncated files, suspicious ZIPs and unexpected multipart fields with 400.
5. Collect validated buffers, send via Nodemailer attachment memory buffers; if temp files are used, use `try/finally` cleanup including SMTP failure/timeout and request abort.
6. No file content in logs, JSON cache or public uploads. Avoid running untrusted document macros; optionally antivirus before production.
## Conventions
Separate detection from route handler, no user-supplied paths, normalized attachment basename; uniform client-safe errors.
## Verification
- [ ] Test valid PDF, DOC, DOCX, JPEG and PNG fixtures.
- [ ] Test spoofed extension/MIME, ZIP bomb/truncation, oversize, extra files and missing required files.
- [ ] Confirm cleanup on both success/error; no document reachable via URL.
- [ ] Browser and server max sizes agree.
