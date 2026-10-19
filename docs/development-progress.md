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

**Findings:** Local typechecks, tests, builds, and the localhost API smoke check passed. The initial and repeat approved SSDP discovery sessions ran through the API and returned zero devices. The repeat session returned `{"devices":[]}`; because discovery returned no candidates, `/state/device/deviceinfo` was not called. The TV was not paired and no control endpoint was used.

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

**Status:** Offline implementation complete — awaiting live pairing approval

**Completed:** Added typed `/pairing/start` and `/pairing/pair` request/response handling, stable device/session checks, PIN validation, a platform Keychain adapter, a pairing manager that adopts tokens into an injected store, an in-memory test double, an `AUTH`-header control client, and a one-command-at-a-time confirmation-gated key-command allowlist. Added an explicit TLS policy boundary that fails closed when pinned verification is not available. Added a fake VIZIO device and API/UI dry-run flow for pairing and controls.

**Validation:** Full workspace typecheck, 22 tests, and build passed. All integration tests use injected transports or the fake device; no TV request was sent. CI now repeats the same checks on pushes and pull requests.

**Not implemented:** A live peer-certificate source for Node fetch, live pairing, authenticated reads, and live control. The dry-run API uses an in-memory token store explicitly; production pairing is designed to use the macOS Keychain adapter.

**Approval requested:** Review the offline implementation and explicitly approve the first live pairing attempt. That approval must identify the selected device and confirm that the TV may display a pairing PIN. Control requests remain separately gated.

### Phase 4 offline checkpoint

**Status:** Recommendation boundary complete — provider integration deferred

**Completed:** Added shared movie-search contracts, an injectable `MovieProvider` boundary, an in-memory provider with local fixtures, `GET /api/movies/search` validation with API coverage, and a small web search surface.

**Constraint:** No external movie provider call is made. TMDB credentials, attribution details, rate limits, caching, and provider selection remain a separate implementation decision.

### Offline completion checkpoint

**Status:** Complete — final hardware gate remains

**Completed:** Added the fake-TV contract simulator, dry-run pairing and command routes, UI confirmation states, explicit TLS fail-closed tests, protocol failure coverage, a reproducible offline validation guide, and GitHub Actions CI.

**Remaining:** Power on the target TV, verify same-LAN discovery, then separately approve and perform live pairing. No device-dependent work is being treated as complete until that check is observed.
