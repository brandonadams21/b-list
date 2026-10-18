# B-List GitHub Project

This file defines the source-of-truth configuration for the hosted GitHub Project. The repository remains the canonical place for code, decisions, progress reports, and issue/PR templates.

## Project

- **Name:** b-list tracker
- **Type:** User-owned GitHub Project, linked to the repository
- **Primary view:** Board
- **Repository:** `brandonadams21/b-list`
- **Project URL:** <https://github.com/users/brandonadams21/projects/6>

## Status columns

1. Backlog
2. Ready
3. In progress
4. Blocked
5. In review
6. Done

## Fields

- **Phase:** Phase 1 Research, Phase 2 Foundation, Phase 3 Pairing and control, Phase 4 Recommendation backend, Phase 5 Mobile interface, Phase 6 TV interface, Phase 7 Playback and personalization
- **Priority:** P0, P1, P2
- **Area:** Architecture, TV integration, Backend, Web, Data, Security, Documentation
- **Hardware access:** Not needed, Read-only approved, Pairing approved, Control approved

## Initial cards

| Status | Issue | Phase | Card | Area | Hardware access |
| --- | --- | --- | --- | --- | --- |
| Done | [#7](https://github.com/brandonadams21/b-list/issues/7) | Phase 2 Foundation | Monorepo foundation and local tooling | Architecture | Not needed |
| Done | [#4](https://github.com/brandonadams21/b-list/issues/4) | Phase 2 Foundation | Typed VIZIO SSDP discovery and device-info client | TV integration | Read-only approved |
| Done | [#5](https://github.com/brandonadams21/b-list/issues/5) | Phase 2 Foundation | Mocked protocol, API, typecheck, and build tests | Security | Not needed |
| Blocked | [#1](https://github.com/brandonadams21/b-list/issues/1) | Phase 2 Foundation | Repeat hardware discovery when the TV is reachable on the same LAN | TV integration | Read-only approved |
| Backlog | [#6](https://github.com/brandonadams21/b-list/issues/6) | Phase 3 Pairing and control | Define and review exact pairing protocol | Security | Pairing approved |
| Backlog | [#2](https://github.com/brandonadams21/b-list/issues/2) | Phase 3 Pairing and control | Implement secure token storage and user-confirmed controls | TV integration | Control approved |
| Backlog | [#3](https://github.com/brandonadams21/b-list/issues/3) | Phase 4 Recommendation backend | Design recommendation data model and TMDB boundary | Backend | Not needed |

## Operating rule

Every card must link to an issue or pull request and identify its approved phase. Moving a card into a new phase requires explicit human approval recorded in the issue or project discussion.
