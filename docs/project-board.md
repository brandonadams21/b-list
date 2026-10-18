# B-List GitHub Project

This file defines the source-of-truth configuration for the hosted GitHub Project. The repository remains the canonical place for code, decisions, progress reports, and issue/PR templates.

## Project

- **Name:** B-List Development
- **Type:** Repository project
- **Primary view:** Board
- **Repository:** `brandonadams21/b-list`

## Status columns

1. Backlog
2. Ready
3. In progress
4. Blocked
5. In review
6. Done

## Fields

- **Phase:** 1 Research, 2 Foundation, 3 Pairing and control, 4 Recommendation backend, 5 Mobile interface, 6 TV interface, 7 Playback and personalization
- **Priority:** P0 Critical, P1 High, P2 Normal, P3 Later
- **Area:** Architecture, TV integration, Backend, Web, Data, Security, Documentation
- **Hardware access:** Not needed, Read-only approved, Pairing approved, Control approved

## Initial cards

| Status | Phase | Card | Area | Hardware access |
| --- | --- | --- | --- | --- |
| Done | 2 | Monorepo foundation and local tooling | Architecture | Not needed |
| Done | 2 | Typed VIZIO SSDP discovery and device-info client | TV integration | Read-only approved |
| Done | 2 | Mocked protocol, API, typecheck, and build tests | Security | Not needed |
| Blocked | 2 | Repeat hardware discovery when the TV is reachable on the same LAN | TV integration | Read-only approved |
| Backlog | 3 | Define and review exact pairing protocol | Security | Pairing approved |
| Backlog | 3 | Implement secure token storage and user-confirmed controls | TV integration | Control approved |
| Backlog | 4 | Design recommendation data model and TMDB boundary | Backend | Not needed |

## Operating rule

Every card must link to an issue or pull request and identify its approved phase. Moving a card into a new phase requires explicit human approval recorded in the issue or project discussion.
