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

**Findings:** Local typechecks, tests, builds, and the localhost API smoke check passed. The approved SSDP discovery session ran through the API and returned zero devices. Because discovery returned no candidates, `/state/device/deviceinfo` was not called. The TV was not paired and no control endpoint was used.

**Decisions required:** Whether to proceed to Phase 3 pairing and TV control, and whether to repeat the read-only hardware check when the TV is reachable on the same LAN.

**Risks:** The VIZIO SmartCast API is reverse-engineered, firmware-dependent, and uses a self-signed HTTPS certificate. No authentication token is stored or sent by Phase 2.

**Next action:** Review the Phase 2 results. If approved, define the exact pairing flow and restricted command set for Phase 3.

**Approval requested:** Approval to begin Phase 3 is not yet granted. Pairing and control remain disabled.
