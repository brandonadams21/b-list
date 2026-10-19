# Phase 3 pairing and control protocol

**Status:** Proposal for review — planning only

This document defines the proposed pairing and control boundary for B-List. It does not authorize pairing, token creation, or control requests. Those actions require a separate approval after this proposal is reviewed.

## Evidence and constraints

The VIZIO SmartCast local API is reverse-engineered rather than an official public API. The protocol references below are based on maintained community implementations and the existing Phase 2 client:

- [Vizio SmartCast API reference](https://github.com/exiva/Vizio_SmartCast_API)
- [vizaio pairing and token behavior](https://github.com/raman325/vizaio)
- [vizio-smart-cast pairing client](https://github.com/heathbar/vizio-smart-cast)

Known constraints:

- The API uses HTTPS with a self-signed certificate on firmware-dependent ports. Discovery must supply the device location; the client must not blindly assume a port.
- The API uses a literal `AUTH` header for authenticated calls. It does not use `Authorization: Bearer`.
- The current B-List client is read-only and has no pairing or control transport.
- The Phase 2 discovery sessions found no TV, so the flow below has not been exercised against the target hardware.

## Proposed pairing flow

### Preconditions

1. SSDP discovery returns exactly one selected candidate.
2. The user sees the candidate name, model if available, host, and API location.
3. The user explicitly confirms that B-List may request pairing with that device.
4. B-List generates or loads one stable per-installation `DEVICE_ID`. It must not change automatically between runs.
5. No pairing attempt is retried automatically.

### Start the challenge

Send an unauthenticated JSON request:

```http
PUT /pairing/start
Content-Type: application/json
```

```json
{
  "DEVICE_NAME": "B-List",
  "DEVICE_ID": "stable-installation-id"
}
```

Expected response fields:

```json
{
  "STATUS": { "RESULT": "SUCCESS" },
  "ITEM": {
    "PAIRING_REQ_TOKEN": 123456,
    "CHALLENGE_TYPE": 1
  }
}
```

The pairing request token and challenge type remain transient in memory only. They must not be written to Git, logs, issue comments, analytics, or persistent storage.

### Confirm the PIN

The TV displays a PIN. B-List prompts the user to enter that PIN and validates the input locally as a string before sending it. The PIN must never be inferred, guessed, retried automatically, or included in diagnostic logs.

### Complete the challenge

After the user submits the PIN, send one unauthenticated JSON request:

```http
PUT /pairing/pair
Content-Type: application/json
```

```json
{
  "DEVICE_ID": "stable-installation-id",
  "CHALLENGE_TYPE": 1,
  "RESPONSE_VALUE": "user-entered-pin",
  "PAIRING_REQ_TOKEN": 123456
}
```

Only a response with an explicit success result and a non-empty `ITEM.AUTH_TOKEN` is considered paired. The token is adopted immediately into the protected credential store; it is never returned to the UI, written to logs, or included in issue/PR text.

### Cancellation

The reference describes `PUT /pairing/cancel`, but community reports show firmware-dependent behavior. The first implementation should not send cancellation automatically. If cancellation is needed, it must be a separately confirmed action after the target firmware behavior is verified.

## Token lifecycle

- Store the token in the platform credential store with restrictive access. Do not use repository files, `.env` files, browser storage, or plaintext application settings.
- Store non-secret metadata separately: device ID, device location, model, and the time the token was created.
- Send the token only as `AUTH: <token>` over the approved local HTTPS transport.
- Treat the token as a password. Redact it from errors, telemetry, test snapshots, and debugging output.
- Do not automatically re-pair after a failed request. A re-pair may invalidate the prior token when the same device ID is reused; require user confirmation and surface the consequence first.
- On an authentication failure, stop and request re-pair approval. Never fall back to unauthenticated control.

## TLS and transport decision

The reference clients commonly disable certificate verification for local devices. B-List must not silently disable TLS verification or apply a global insecure setting.

Before implementation, choose one of these explicit strategies:

1. Trust-on-first-use with a displayed certificate fingerprint and a stored, user-approved fingerprint.
2. A narrowly scoped local-device trust configuration that applies only to the selected device and only to the VIZIO client.

The chosen strategy must be documented before any pairing request is sent.

## Proposed authenticated allowlist

The initial control surface should be narrow and explicit:

### Read operations

- `GET /state/device/power_mode`
- `GET /menu_native/dynamic/tv_settings/devices/current_input`
- `GET /menu_native/dynamic/tv_settings/devices/name_input`

### User-confirmed control operations

- `PUT /key_command/` with exactly one `KEYPRESS` item per request.
- Initially allow only the documented volume, mute, input-cycle, and power codes after the user confirms each action.
- Input selection may use the documented current-input hash flow, but must read the current value immediately before a write and reject stale hashes.

### Explicitly out of scope for the first control slice

- `KEYDOWN` and `KEYUP` sequences.
- Multi-command batches.
- Picture, audio, network, or system setting writes.
- Wake-on-LAN or power-on behavior while the TV is sleeping.
- App launching and playback commands.
- Automatic cancellation, unpairing, or re-pairing.

Every control operation must be rejected unless a valid stored token exists and the user has approved the specific action or an explicitly approved session policy.

## Failure handling

The client should surface these pairing results without retrying:

- `INVALID_PARAMETER`: show a protocol/configuration error and stop.
- `PAIRING_DENIED` or `CHALLENGE_INCORRECT`: report an incorrect PIN and require a new user action.
- `VALUE_OUT_OF_RANGE`: reject the input locally and do not resend.
- `MAX_CHALLENGES_EXCEEDED`: stop and require the user to clear the TV-side pairing state.
- `BLOCKED`: report that another pairing flow is active; do not start a second flow.
- Missing or malformed auth token: treat pairing as failed and discard transient response data.

All failures must redact the PIN, pairing token, and auth token.

## Review checklist before implementation

- [ ] Select the TLS trust strategy.
- [ ] Approve the stable `DEVICE_ID` format and displayed `DEVICE_NAME`.
- [ ] Approve platform credential-store behavior and recovery.
- [ ] Approve whether cancellation is deferred or separately tested.
- [ ] Approve the initial authenticated read allowlist.
- [ ] Approve the per-action control confirmation policy.
- [ ] Approve the exact control codes and exclude all unlisted endpoints.
- [ ] Approve mocked tests before any live pairing attempt.

Until every required item is reviewed and approved, B-List remains read-only.
