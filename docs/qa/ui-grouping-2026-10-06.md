# UI grouping — 6 October 2026

Primary references:
- https://www.carbondesignsystem.com/building-blocks/core/patterns/forms — group-related fields; distinguish inter-group and intra-group spacing.
- https://www.carbondesignsystem.com/building-blocks/foundations/spacing/overview — consistent rhythm communicates relationships.
- https://developer.android.com/design/ui/mobile/guides/components/material-overview?hl=en — containment groups related content/actions.
- https://www.radix-ui.com/themes/docs/components/separator — an optional separator primitive, not a requirement for every section.

HeyPals application: photo/avatar/help/photo actions form one compound task, so give this group a faint violet gradient (12% at top to transparent), 24px corners, no border/bevel. The name field already supplies containment; leave its outer group bare. Hand preference and language stay separated by spacing. Do not wrap every label and field in another card. Keep the existing native footer clearance and scrolling for short phones. No new UI library needed.

This is a first applied grouping treatment for the profile, not an audit claim for every game popup.

## Contemporary visual direction, follow-up

Carbon/Material establish grouping rules, but are not the visual reference for this pass. Reviewed current primary component pages:
- https://ui.aceternity.com/components/glowing-effect — directional illuminated borders with adjustable spread, proximity and motion. Keep that emphasis for actions, not every field group.
- https://reactbits.dev/components/magic-bento — visual exploration reference; page is client-rendered, so its implementation was not verified from the fetched documentation.
- https://shaders.paper.design/ — mesh/radial/grain gradients and glass/image effects. Useful material vocabulary; a shader runtime is not necessary for a static small section.

Applied design judgment: replace the profile photo group's uniform top-to-bottom wash with two broad asymmetric violet reflections, fading into the existing frosted popup surface. Keep no inner bevel, no additional border, and no extra blur pass. Photo controls remain grouped; the name input and preferences use spacing instead of more nested cards. This is an independently authored CSS treatment inspired by the material vocabulary, not an imported library component. Compare style157 versus style158 captures at the same viewport.

## Shared rollout 160
- The existing nonlinear reflection now also contains Host Panel settings sections and the room roster. Existing rule disclosures and popup audio retain the same token. No extra blur/compositor layer per section.
- Lime/primary actions share white-lime orbit and glow via their component classes; quiet actions share violet orbit, excluding round back/cancel buttons. This applies to the top-level application UI that loads app-ux; game iframe controls are outside this stylesheet.
- IntersectionObserver pauses the effect outside the viewport, and page visibility pauses it in the background. Dynamically added controls are observed and detached controls are released.
- Verification: style160 browser capture suite covers player popups and native host fixtures in Chrome/WebKit, 320 and 393 px; not physical-device certification.
