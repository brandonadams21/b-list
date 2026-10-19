# Offline validation guide

This guide covers the maximum useful B-List validation before the target TV is powered on or reachable.

## Run the checks

From the repository root:

```sh
pnpm install
pnpm typecheck
pnpm test
pnpm build
```

The API can be run locally with `pnpm dev:api`, and the web shell with `pnpm dev:web`.

## What is safe to exercise with the TV off

- Movie search uses the local fixture provider and the injectable `MovieProvider` boundary.
- The fake VIZIO device runs pairing, PIN validation, protected token storage, and one-command confirmation entirely in memory.
- The web dry-run controls use `/api/tv/dry-run/*` routes only. They do not open sockets or send requests to a real device.
- Real SSDP discovery may be run as a read-only check. An empty result is expected while the TV is off.
- The real fetch transport supports an explicit system trust policy or a fail-closed pinned fingerprint verifier boundary. No insecure global TLS bypass is used.

## Final device-dependent step

The remaining hardware gate is to power on the selected TV and confirm that it is reachable on the same LAN. Only after explicit approval should B-List attempt live pairing, persist the resulting token in the macOS Keychain, or send a user-confirmed authenticated command.
