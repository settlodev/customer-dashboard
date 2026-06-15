# Admin Hierarchy Rework — Phase 3B: Real "send email to account" (Kafka) — Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`).
> **STATUS: READY — awaiting user go.** Multi-repo + a Settlo Common version bump → validated mostly in CI/deploy (see Build/Validation).

**Goal:** Replace the admin account header's `mailto:` with a real **compose-and-send** action. Internal staff submit a subject + body; the **Accounts** service publishes a Kafka event; the **Communications** service consumes it and sends the email through its existing async pipeline. Chosen transport: **Kafka event** (most consistent with how resend-verification works today).

**Architecture / flow:**
```
Dashboard SendEmailDialog → sendAccountEmail(accountId, subject, body)
  → POST /api/v1/admin/accounts/{accountId}/send-email  (Accounts, role-gated, resolves account email)
  → kafkaProducer.publishReliable(KafkaTopics.SEND_CUSTOM_EMAIL, accountId, SendCustomEmailDto)
  → [Kafka] → Communications AdminEmailConsumer
  → CommunicationService.receiveRequest(...) + CommunicationCreatedEvent → async send
```

**Spec:** `docs/superpowers/specs/2026-06-15-admin-account-business-entity-hierarchy-design.md` (Phase 3, §7 send-email).

**Repos touched:** Settlo Common (`/Users/Peter/Settlo/Settlo Common`), Accounts (`/Users/Peter/Settlo/Settlo Accounts Service`), Communications (`/Users/Peter/Settlo/Settlo Communications Service`), Customer-Dashboard (`/Users/Peter/Settlo/Customer-Dashboard`).

---

## Build / Validation constraints (READ FIRST)
- **Settlo Common is the gating dependency.** The new Kafka topic (enum) + shared event DTO live in Settlo Common. Today: **Accounts = `settlo-common 0.8.59-ALPHA`**, **Communications = `0.8.52-ALPHA`** (skew). Both must move to a new version (e.g. **`0.8.60-ALPHA`**) that contains the new topic + DTO. Until that version is **published** (CodeArtifact, at CI/deploy — like the prior `0.8.59` planCode-on-events bump), Accounts/Communications **cannot compile** against the new symbols locally.
- **Therefore:** author Common + Accounts + Communications carefully; their builds/tests run in **CI/deploy**. Locally, attempt `./gradlew :publishToMavenLocal` on Settlo Common + service builds **only if** the toolchain resolves (mirror the Reports "author+review+Opus-holistic, CI runs it" model if not). The **Customer-Dashboard** changes ARE locally verifiable (`tsc`).
- **Communications jumps `0.8.52 → 0.8.60`** — confirm that range carries no breaking change to Communications (skim the Common changelog/diff between those tags; if risky, instead add only the new topic+DTO on top of `0.8.52`'s line and publish `0.8.52.x`). FLAG this to the user before merging.
- **No new config keys** (Kafka infra already configured in both services; the Accounts endpoint publishes to Kafka, no new service URL). So **no external `application.properties` additions** needed at deploy for this feature.
- USER deploys/pushes; all work stays local on each repo's `alpha`.

---

## Task 1: Settlo Common — topic + shared DTO + version bump

**Files (in `/Users/Peter/Settlo/Settlo Common`):**
- Modify: `src/main/java/co/tz/settlo/common/enums/KafkaTopics.java`
- Create: `src/main/java/co/tz/settlo/common/dto/communication/SendCustomEmailDto.java`
- Modify: `build.gradle` (version)

- [ ] **Step 1 — add the topic.** In `KafkaTopics.java`, add an enum constant `SEND_CUSTOM_EMAIL` (match the file's existing style/section; topic name = `name()`).
- [ ] **Step 2 — shared DTO.** Create `SendCustomEmailDto` in `co.tz.settlo.common.dto.communication` (Lombok `@Data @Builder @NoArgsConstructor @AllArgsConstructor`):
```java
package co.tz.settlo.common.dto.communication;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SendCustomEmailDto {
    private UUID accountId;       // for correlation/audit
    private UUID adminUserId;     // who initiated (from SecurityContext)
    private String recipient;     // resolved account email
    private String subject;
    private String body;          // plain-text body
    private String htmlContent;   // optional HTML body (preferred when present)
}
```
- [ ] **Step 3 — bump version.** In `build.gradle`, bump the `projectVersion` (e.g. `0.8.59-ALPHA` → `0.8.60-ALPHA`). Confirm the publish task/coordinates with the user (CodeArtifact). 
- [ ] **Step 4 — build/publish (where possible).** `./gradlew build` and, if the toolchain allows, `./gradlew publishToMavenLocal` so the services can resolve it locally; otherwise note that CI publishes it. Commit Common changes.

---

## Task 2: Accounts — send-email endpoint that publishes the event

**Files (in `/Users/Peter/Settlo/Settlo Accounts Service`):**
- Modify: `pom.xml` (settlo-common → new version)
- Create: `src/main/java/co/tz/settlo/accounts/admin/dto/SendCustomEmailRequest.java`
- Modify: `src/main/java/co/tz/settlo/accounts/admin/controller/AdminController.java`
- Modify: `src/main/java/co/tz/settlo/accounts/admin/service/AdminService.java`
- Test: `src/test/java/co/tz/settlo/accounts/admin/service/AdminServiceSendEmailTest.java`

- [ ] **Step 1 — bump dependency.** `pom.xml`: `settlo-common` version → the Task-1 version.
- [ ] **Step 2 — request DTO.** `SendCustomEmailRequest` (Lombok `@Data @NoArgsConstructor @AllArgsConstructor`):
```java
@Data @NoArgsConstructor @AllArgsConstructor
public class SendCustomEmailRequest {
    @NotBlank private String subject;
    @NotBlank private String body;
    private Boolean html; // optional; when true, body is HTML
}
```
- [ ] **Step 3 — service method.** In `AdminService`, add `sendCustomEmail(UUID accountId, SendCustomEmailRequest req, UUID adminUserId)` mirroring `resendVerificationEmail` + `republishAccount` (which uses the Kafka producer). Load the account (`accountRepository.findById(...).orElseThrow(EntityNotFoundException)`); build `SendCustomEmailDto` (recipient=`account.getEmail()`, subject/body, `htmlContent` = body when `req.html==TRUE` else null, accountId, adminUserId); publish via the same producer `AccountService` uses — `publishReliable(KafkaTopics.SEND_CUSTOM_EMAIL, accountId.toString(), dto)` (confirm the producer bean injected; `AccountService.publishAccountEvent` calls `kafkaProducer.publishReliable(...)`). `log.info("Published SEND_CUSTOM_EMAIL for account {} by admin {}", accountId, adminUserId)`.
- [ ] **Step 4 — controller endpoint.** In `AdminController`, mirror the `resend-verification-email` mapping:
```java
@PostMapping("/accounts/{accountId}/send-email")
@PreAuthorize("hasAuthority('INTERNAL_internal:accounts:manage')")
@Operation(summary = "Send custom email", description = "Sends a free-form email to the account owner via Communications (async).")
public ResponseEntity<Map<String, String>> sendCustomEmail(
        @PathVariable UUID accountId,
        @Valid @RequestBody SendCustomEmailRequest request,
        @AuthenticationPrincipal Jwt jwt) {
    UUID adminUserId = UUID.fromString(jwt.getSubject());
    adminService.sendCustomEmail(accountId, request, adminUserId);
    return ResponseEntity.ok(Map.of("message", "Email queued"));
}
```
(Confirm how other admin endpoints read the caller; if they don't take `Jwt`, match the local pattern — e.g. `SecurityContextHolder` — used elsewhere.)
- [ ] **Step 5 — test** mirroring `AdminServiceRepublishTest`: mock `accountRepository` + the producer; call `sendCustomEmail`; `verify` the producer was called with `KafkaTopics.SEND_CUSTOM_EMAIL` and a `SendCustomEmailDto` whose recipient == account email + subject/body match. Run `./mvnw test -Dtest=AdminServiceSendEmailTest` (CI if local can't resolve Common).
- [ ] **Step 6 — commit** Accounts changes.

---

## Task 3: Communications — consume the event and send

**Files (in `/Users/Peter/Settlo/Settlo Communications Service`):**
- Modify: `pom.xml` (settlo-common → new version)
- Modify: `config/KafkaConfig.java` (add `SEND_CUSTOM_EMAIL` to consumed topics)
- Create: `infrastructure/kafka/input/AdminEmailConsumer.java`
- Possibly modify: `SourceEvent` / `SourceService` enums (add `ADMIN_SEND_EMAIL` / `ADMIN_PANEL` if absent)
- Test: `src/test/java/.../AdminEmailConsumerTest.java`

- [ ] **Step 1 — bump dependency** (`0.8.52 → 0.8.60`); see the skew caveat in Build/Validation.
- [ ] **Step 2 — register topic.** Add `KafkaTopics.SEND_CUSTOM_EMAIL` to the `CONSUMED_TOPICS` list in `KafkaConfig`.
- [ ] **Step 3 — consumer** mirroring `AccountVerificationConsumer` (SpEL topic, `Map<String,Object>` payload → `objectMapper.convertValue(payload, SendCustomEmailDto.class)`, DLQ on failure, ack). In its handler, build a `CommunicationRequest` (sourceEvent `ADMIN_SEND_EMAIL`, sourceService `ADMIN_PANEL`, random correlationId) with one `EmailRequestData` (recipient, subject, `htmlContent` when present else `message`=body) → `communicationService.receiveRequest(req)` → `eventPublisher.publishEvent(new CommunicationCreatedEvent(comm.getId()))`. (Exactly the `AccountVerificationService.handleEmailVerification` shape, minus the template.)
- [ ] **Step 4 — enum values.** If `SourceEvent.ADMIN_SEND_EMAIL` / `SourceService.ADMIN_PANEL` don't exist, add them (match the enum's `.value()` convention).
- [ ] **Step 5 — test** mirroring `PushTokenLifecycleConsumerTest`: success path (→ `communicationService.receiveRequest` called + ack) and failure path (→ DLQ + ack). `./mvnw test` (CI if local can't resolve Common).
- [ ] **Step 6 — commit** Communications changes.

---

## Task 4: Customer-Dashboard — action + compose dialog + wire

**Files (in `/Users/Peter/Settlo/Customer-Dashboard`):**
- Modify: `lib/actions/admin/accounts.ts` (add `sendAccountEmail`)
- Create: `components/admin/account-detail/send-email-dialog.tsx`
- Modify: `components/admin/account-detail/account-detail-view.tsx` (replace the `mailto:` button) — and thread a `canManage` (or `canResend`) gate

- [ ] **Step 1 — action.** In `lib/actions/admin/accounts.ts`, mirror `suspendAccount`:
```ts
export async function sendAccountEmail(
  accountId: string,
  subject: string,
  body: string,
): Promise<FormResponse<{ message: string }>> {
  try {
    const result = await staffClient().post<{ message: string }, { subject: string; body: string }>(
      `/api/v1/admin/accounts/${accountId}/send-email`,
      { subject, body },
    );
    return parseStringify({ responseType: "success", message: result?.message ?? "Email queued", data: result });
  } catch (error: any) {
    return parseStringify({ responseType: "error", message: error?.message || "Failed to send email", error: error instanceof Error ? error : new Error(String(error)) });
  }
}
```
- [ ] **Step 2 — dialog** `SendEmailDialog` (`"use client"`): controlled `open/onOpenChange`; `Input` subject + `Textarea` body; submit via `useTransition` → `sendAccountEmail(accountId, subject, body)`; `useToast` on result; close + clear on success. Mirror an existing admin dialog (e.g. `apply-discount-dialog.tsx` / `account-action-dialog.tsx`).
- [ ] **Step 3 — wire into header.** In `account-detail-view.tsx`, replace the `mailto:` `<Button asChild>...<a href={mailto}>` (≈ lines 110–115) with a `<Button>` that opens `SendEmailDialog` (state + `<SendEmailDialog accountId={account.id} open=... onOpenChange=... />`). Gate visibility to `canManage` (matches the backend `:manage` authority) — thread `canManage` (already a prop on the view). Keep the `Mail` icon + "Email" label.
- [ ] **Step 4 — verify + commit.** `npx tsc --noEmit` clean; commit the 3 dashboard files.

---

## Final review & finishing
- [ ] **Local verify (dashboard):** `npx tsc --noEmit` + lint. **Backend:** build/test in CI/deploy (Common published first); confirm with user.
- [ ] **Opus holistic** over the full 3B diff (4 repos): topic+DTO shared in Common; Accounts endpoint role-gated + resolves email server-side + publishes the right topic/payload; Communications consumer mirrors the verification consumer + routes through `CommunicationService` (persist/async/DLQ); dashboard action+dialog gated to `canManage`; `mailto:` fully replaced; version bumps consistent across both services; no new config keys.
- [ ] **Report + deploy notes:** Common must publish (`0.8.60-ALPHA`) before Accounts/Communications deploy; both services bump to it; Communications `0.8.52→0.8.60` skew verified; Kafka topic auto-used (no infra change). Phase 3 complete after this.

## Self-review (author checklist)
- **Spec §7 send-email:** real compose dialog + `sendAccountEmail` action ✓; chosen transport = Kafka event (user-selected) ✓; role-gated ✓.
- **Reuse:** existing producer (`publishReliable`), existing Communications send pipeline (`CommunicationService.receiveRequest` + `CommunicationCreatedEvent`), existing admin endpoint/test patterns.
- **Cross-repo contract:** topic enum + DTO in Common (shared); Accounts produces, Communications consumes the SAME `SEND_CUSTOM_EMAIL` + `SendCustomEmailDto`.
- **Risk flags:** Common version bump must publish first; Communications version jump; all backend validation in CI.
