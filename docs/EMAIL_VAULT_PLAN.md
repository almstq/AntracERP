# Email-to-Vault Architecture Plan

**Status:** Architecture documented. Build deferred — requires custom domain email setup (Mustarq to decide timing).
**Codename:** PROOF CHAIN — Phase 2
**Author:** Claude Code (Session 10, 2026-06-01)

---

## Concept

Every Antrac transaction (PO, ticket, work order, fuel request) has a dedicated
email address. External parties — suppliers, directors, staff — forward approval
emails, signed PDFs, and receipts to that address. A Cloud Function intercepts
inbound email, extracts attachments, and deposits them into the Document Vault
linked to the correct entity. No manual upload required.

Result: email approvals and physical-signature scans flow directly into the
evidence chain — immutable, attributed, timestamped.

---

## Address Format

```
{type}-{entityId}@vault.antrac.mv
```

Examples:
```
po-PO-2026-001@vault.antrac.mv       → Purchase Order PO-2026-001
ticket-TKT-2026-047@vault.antrac.mv  → Issue Ticket TKT-2026-047
wo-WO-2026-012@vault.antrac.mv       → Work Order WO-2026-012
fuel-FR-2026-008@vault.antrac.mv     → Fuel Request FR-2026-008
```

The prefix maps to a Firestore collection:
| Prefix  | Collection       |
|---------|-----------------|
| `po`    | purchaseOrders  |
| `ticket`| tickets         |
| `wo`    | workOrders      |
| `fuel`  | fuelRequests    |

---

## Implementation Steps

### Step 1 — Custom Domain Email Setup (Mustarq prerequisite)
- Register `vault.antrac.mv` (or subdomain of existing domain)
- Configure MX records to point to inbound email provider (see Provider Options)
- This is the only step Mustarq must action before build begins

### Step 2 — Inbound Email Provider
Set up inbound email parsing. The provider receives email at `*@vault.antrac.mv`,
extracts headers + body + attachments, and POSTs a webhook to a Cloud Function URL.

**Provider Options:**

| Provider | Free Tier | Notes |
|----------|-----------|-------|
| **SendGrid Inbound Parse** | Yes (with SendGrid account) | Best documented, easy webhook setup. Recommended. |
| **Mailgun Inbound Routes** | 1000 msgs/mo free | Similar feature set, slightly simpler pricing |
| **Cloudflare Email Workers** | Yes (routing only) | Routes to Worker; needs custom parsing logic |
| **Postmark Inbound** | 100 msgs/mo free | Clean parsing, well-structured JSON |

**Recommendation:** SendGrid Inbound Parse. WLI email volume is very low (< 50
emails/week), so free tier covers it indefinitely.

### Step 3 — Cloud Function: `inboundEmailVault`
An HTTP-triggered Cloud Function (not scheduled) that:

1. **Receives the webhook** from the inbound email provider (POST, multipart/form-data)
2. **Parses `to` address** → extracts `{type}` and `{entityId}` from the local part
3. **Validates entity exists** in Firestore (rejects unknown addresses silently)
4. **Saves body** as `email-body-{timestamp}.txt` → uploaded to Storage + Vault
5. **Saves each attachment** → uploaded to Storage + Vault, linked to entity
6. **Attributes all docs** as `uploadedByName: "Email Relay (auto)"`, `uploadedById: "email_relay"`
7. **Writes a timeline event** on the entity: `"Document received via email from {sender}"`

```typescript
// Pseudocode skeleton
export const inboundEmailVault = onRequest(async (req, res) => {
  const { to, from, subject, text, attachments } = parseInboundPayload(req);
  const { type, entityId } = parseAddress(to);     // e.g. "po", "PO-2026-001"
  const collection = TYPE_TO_COLLECTION[type];
  if (!collection) return res.status(200).send('unknown type, ignored');

  const entity = await getFirestore().collection(collection).doc(entityId).get();
  if (!entity.exists) return res.status(200).send('entity not found, ignored');

  const uploader = { uid: 'email_relay', displayName: `Email Relay (auto) — ${from}` };

  // Save email body as .txt
  await uploadBufferToVault(collection, entityId, Buffer.from(text), `email-${Date.now()}.txt`, 'text/plain', uploader);

  // Save each attachment
  for (const att of attachments) {
    await uploadBufferToVault(collection, entityId, att.content, att.filename, att.contentType, uploader);
  }

  // Timeline event
  await addTimelineEvent(collection, entityId, {
    event: `Document received via email from ${from}: ${subject}`,
    actor: 'email_relay',
    timestamp: new Date(),
  });

  res.status(200).send('ok');
});
```

### Step 4 — Firestore Rules Update
Allow `email_relay` system user to write to `documents` collection and entity
`attachments[]` arrays (same as authenticated user writes, but without Firebase Auth):

```
// In firestore.rules — add to documents write rule:
allow write: if request.auth != null || request.resource.data.uploadedById == 'email_relay';
```

For production, use a service account token on the Cloud Function instead.

### Step 5 — UI: Show Email-Received Docs
Email-relayed docs show in Document Vault and entity attachment panels with:
- Attribution: "Email Relay (auto) — sender@example.com"
- A distinct icon (envelope) to distinguish from manual uploads
- Timeline entry on the entity record

---

## Cost Estimate

| Component | Cost |
|-----------|------|
| SendGrid Inbound Parse | Free (100 emails/day free tier) |
| Cloud Function invocations | Free tier: 2M/month (more than sufficient) |
| Firebase Storage | Existing (< 1 GB/month projected) |
| Custom domain email | ~$12–20/year for MX hosting, or free via Cloudflare |
| **Total** | **~$0/month operational** |

---

## Risks

| Risk | Mitigation |
|------|-----------|
| Spam to vault addresses | Allowlist sender domains (supplier emails only) |
| Unknown entity ID in address | Silently ignore (already in Step 3) |
| Large attachments | Enforce 20 MB limit per file (same as manual upload) |
| Missing custom domain | No build until domain is ready; no workaround |
| Provider webhook retry storms | Idempotent processing by email Message-ID |

---

## Prerequisites Before Build

- [ ] Mustarq decides: which domain for `vault.antrac.mv`?
- [ ] SendGrid account created (or alternative provider chosen)
- [ ] MX records configured on chosen domain
- [ ] Cloud Functions deployed (weeklyOpsSnapshot already sets up the functions project)

---

## Decision

**Decision 29:** Email-to-Vault forwarding — architecture documented (2026-06-01).
Build deferred pending custom domain email setup (Mustarq to decide timing).
