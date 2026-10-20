# Development progress

### Phase checkpoint

**Phase:** Phase 2 — Project foundation and read-only TV integration

**Status:** Complete — awaiting approval

**Approved scope:** Scaffold the monorepo, add the typed VIZIO client, implement SSDP discovery, probe only `/state/device/deviceinfo`, add mocked tests, and document actual device responses. No pairing or control commands.

**Completed:**

- Created the `b-list` pnpm workspace.
- Added API, web, contracts, and VIZIO client packages.
- Added localhost-only API routes for health, discovery, and discovered-device identity.
- Added typed VIZIO SSDP parsing and read-only device-info client.
- Added mocked protocol and API tests.
- Added the initial B-List web shell.

**Findings:** Local typechecks, tests, builds, and the localhost API smoke check passed. The initial, repeat, and latest approved SSDP discovery sessions ran through the API and returned zero devices. The two checks on 2026-10-18 both returned `{"devices":[]}`; because discovery returned no candidates, `/state/device/deviceinfo` was not called. The TV was not paired and no control endpoint was used.

**Decisions required:** Whether the TV is confirmed to be reachable on the same LAN for another read-only check, and whether to proceed to Phase 3 pairing and TV control.

**Risks:** The VIZIO SmartCast API is reverse-engineered, firmware-dependent, and uses a self-signed HTTPS certificate. No authentication token is stored or sent by Phase 2.

**Next action:** Review the Phase 2 results. The hardware check remains blocked because no TV was discovered. If Phase 3 is approved, define the exact pairing flow and restricted command set before any pairing request.

**Approval requested:** Approval to begin Phase 3 is not yet granted. Pairing and control remain disabled.

### Phase 3 planning checkpoint

**Status:** Proposal drafted — awaiting review

**Approved scope:** Research and document the pairing handshake, token lifecycle, TLS decision, failure handling, and the smallest authenticated command allowlist. No pairing or control requests are authorized by this planning approval.

**Deliverable:** `docs/phase-3-pairing-protocol.md`

**Current recommendation:** Use the two-step `/pairing/start` and `/pairing/pair` PIN flow, store the resulting token only in a platform credential store, send it only as the literal `AUTH` header, and begin with one-at-a-time user-confirmed commands. Defer cancellation, re-pairing, settings writes, app launching, playback, and wake behavior until separately verified.

**Approval requested:** Review the Phase 3 proposal and approve or revise the TLS strategy, stable device identity, token lifecycle, and command allowlist before implementation or any live pairing request.

### Phase 3 implementation checkpoint

**Status:** Authenticated read-only integration verified — live control remains gated

**Completed:** Added typed `/pairing/start` and `/pairing/pair` request/response handling, stable device/session checks, PIN validation, a platform Keychain adapter, a pairing manager that adopts tokens into an injected store, an in-memory test double, an `AUTH`-header control client, and a one-command-at-a-time confirmation-gated key-command allowlist. Added an explicit TLS policy boundary that fails closed when pinned verification is not available. Added a fake VIZIO device and API/UI dry-run flow for pairing and controls.

**Validation:** Full workspace typecheck, 24 tests, and build passed. The user completed one authenticated read-only device-info request manually; no control request was sent. CI repeats the automated checks on pushes and pull requests.

**Not implemented:** A live peer-certificate source for Node fetch and live control. The dry-run API uses an in-memory token store explicitly; production pairing uses the macOS Keychain adapter boundary.

**Approval requested:** Explicit approval is still required before any volume, mute, input, power, playback, or settings command.

### Live pairing-start checkpoint

**Status:** Complete — manual pairing succeeded

**Observed:** On 2026-10-19, after the user's explicit request, B-List sent one `PUT /pairing/start` request to the selected VIZIO target. The response was HTTP 200 with `STATUS.RESULT: SUCCESS` and `CHALLENGE_TYPE: 1`. The transient pairing request token was redacted and not persisted.

**Remaining:** No authenticated control command has been sent. The transient pairing token and auth token were not recorded in the repository or tracker.

### Manual pairing and Keychain checkpoint

**Status:** Complete — authenticated read-only check verified

**Observed:** The user completed pairing manually, verified the device-scoped token exists in macOS Keychain, and completed one authenticated `GET /state/device/deviceinfo` request. The TV identified itself as model `W4K65M-1030`, cast name `Living Room`, API version `3.7.2-2621.0006`, and firmware version `86.920.9.3-2`. No serial number, device identifier, token, or diagnostic DSN is recorded here.

**Completed:** Added the Keychain-backed authenticated read-only client, an API route protected by prior discovery, and tests proving the token is retrieved from the store and sent only as the `AUTH` header. Control commands remain separately gated.

**Remaining:** Add any desired UI presentation for the authenticated device info. Live control remains separately gated.

### Phase 4 offline checkpoint

**Status:** Recommendation boundary complete — provider integration deferred

**Completed:** Added shared movie-search contracts, an injectable `MovieProvider` boundary, an in-memory provider with local fixtures, `GET /api/movies/search` validation with API coverage, and a small web search surface.

**Constraint:** No external movie provider call is made. TMDB credentials, attribution details, rate limits, caching, and provider selection remain a separate implementation decision.

### Offline completion checkpoint

**Status:** Complete — final hardware gate remains

**Completed:** Added the fake-TV contract simulator, dry-run pairing and command routes, UI confirmation states, explicit TLS fail-closed tests, protocol failure coverage, a reproducible offline validation guide, and GitHub Actions CI.

**Remaining:** Power on the target TV, verify same-LAN discovery, then separately approve and perform live pairing. No device-dependent work is being treated as complete until that check is observed.
