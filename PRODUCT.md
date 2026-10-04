# HeyPals

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Friends playing party games together. The host uses an iPhone app; players use phone controllers, including browser controllers without installing the full app.

## Product Purpose

Play together with a shared TV display and individual phone controls. Players must understand the game state, scores and results without unreadable text or overlapping controls.

## Operating Context

The product includes a native iOS host wrapper, a browser controller and a shared TV surface, including output from iPhone through AirPlay. Local play uses the host's local network. Actual iPhone17Pro checks and browser screenshots are part of this project's verification workflow.

## Capabilities and Constraints

- Preserve working games, game rules, player data, room joining and existing host/controller behavior.
- Rankings expose party standings and the last match; tapping a player opens their profile.
- The user limited the current Impeccable work to the rankings at the bottom of the controller. This is not permission for a project-wide visual replacement.
- Long names, Cyrillic names, zero values and large scores must remain readable on small phones.
- Native navigation and safe areas must not obscure dialog actions.
- Public App Clip availability requires Apple configuration and approval; an embedded, signed Clip is not proof of public availability.

## Brand Commitments

HeyPals branding, existing game logos, supplied Kardia font family and existing trophy/place assets are established project commitments. Follow the user-approved design contract at docs/qa/design-contract-2026.md.

## Evidence on Hand

Existing implementation in public/app.js, public/polish.css and public/native-shell/. Approved branding and game artwork in public/assets/. Browser captures and physical-device captures under .localparty-build/ document specific builds; they must not be represented as evidence for other builds or untested two-phone behavior.

## Product Principles

- Preserve what works while making focused improvements.
- Make information hierarchy obvious and scores readable.
- Verify the rendered result at the intended screen size.
- Distinguish automatic, browser and physical-device verification.

## Open Decisions

No broader visual redesign or new product positioning was approved in this context setup. Current scope was confirmed by the user on 2026-10-01: improve only the bottom controller rankings with Impeccable.
