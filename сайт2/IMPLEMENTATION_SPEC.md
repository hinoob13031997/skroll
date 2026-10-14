# IMPLEMENTATION SPEC

## Stack
Recommended:
- Next.js / React
- TypeScript
- GSAP + ScrollTrigger for the global scroll timeline
- Three.js / React Three Fiber only where 3D materially improves the experience
- Lenis or equivalent smooth-scroll layer
- DOM/HTML for all text, buttons, forms and SEO content
- WebGL for world backgrounds, camera, 3D planets/products/particles where needed

## Architecture rule
Do not build the homepage as six visible `<section>` blocks with normal vertical scrolling. Internally sections can exist, but visually one pinned/staged cinematic canvas should carry the journey.

### Recommended structure
`<UniverseExperience>`
- `<CinematicCanvas />`
- `<OverlayUI />`
- `<HeroChapter />`
- `<LunaChapter />`
- `<SaturnChapter />`
- `<VenusChapter />`
- `<MarsChapter />`
- `<EarthChapter />`
- `<NeptuneChapter />`
- `<FinalReveal />`
- `<StateSelector />`
- `<HowItWorks />`

## Scroll timeline
Map page scroll progress to:
- camera position;
- camera target;
- FOV;
- world opacity / layer visibility;
- lighting intensity and temperature;
- foreground parallax;
- product position/rotation/scale;
- fog;
- texture displacement;
- refraction;
- typography reveal.

## Asset layering
For each world:
1. background / stars
2. planet
3. distant landscape
4. midground
5. product
6. foreground occlusion
7. fog / particles
8. light pass
9. reflection/refraction pass

Current PNGs in this package are art-direction references/crops. For true production animation, recreate clean layer assets or 3D scenes without baked text.

## Product pages
Product pages should be standard performant SSR/SSG pages with cinematic hero + normal DOM content below:
- intro;
- ingredients;
- composition accordion;
- how to take;
- flavor;
- reviews;
- buy buttons;
- related worlds.

## Responsive
### Desktop
Full scroll-cinema + advanced parallax/WebGL.

### Tablet
Reduced geometry and particle count; keep camera transitions.

### Mobile
Use simplified 3D or pre-rendered AVIF/WebP layers with CSS/GSAP transforms. Preserve storytelling, reduce shaders/postprocessing.

## Reduced motion
Respect `prefers-reduced-motion`.
Fallback should become:
- static hero;
- static world images;
- simple crossfades;
- normal scrolling;
- all content and purchase controls remain accessible.

## Performance
- LCP: hero first.
- Lazy-load later worlds.
- Do not load Neptune assets at initial render.
- Use AVIF/WebP for raster backgrounds.
- Use compressed glTF/Draco/KTX2 for 3D.
- Adaptive DPR.
- Cap particle systems on mobile.
- Avoid permanent heavy postprocessing.
- Preload only the current/next chapter.

## Accessibility
- All CTA reachable by keyboard.
- Text stays DOM, not baked into canvas.
- Correct heading hierarchy.
- High contrast.
- Accessible labels on marketplace buttons.
- No autoplay audio.
- Sound must be opt-in.
- Focus states visible.

## Audio
Optional toggle `SOUND`.
- Luna: water / ambient low tone
- Saturn: orbital rumble
- Venus: airy shimmer
- Mars: low-frequency heat/wind
- Earth: water/wind
- Neptune: underwater/liquid ambience
Use smooth crossfades; default muted.

## E-commerce
Primary CTA: own Moonvit checkout if available.
Secondary:
- Ozon
- Wildberries

Marketplace links are in `data/products.json`.

## Analytics
Track:
- hero CTA;
- chapter completion;
- world opened;
- selector choice;
- Ozon click;
- Wildberries click;
- own checkout click;
- B2B lead;
- contact form;
- reduced-motion usage;
- device/performance bucket.

## CMS
Recommended product model:
- planet
- product name
- cinematic tagline
- short description
- long description
- components
- full composition
- nutrition
- flavor
- how-to-take
- price
- Ozon URL
- Wildberries URL
- review source
- hero asset
- scene assets
- SEO title / description
