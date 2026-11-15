# Reference-quality notes for continuation

These are general findings from the repository's earlier private reference study (`references/reports/motion.md` and `CONTEXT.md`), supplemented by review of the user's supplied shorts. They are implementation guidance, not proof that a new render matches the references. No private reference frames or footage are included here. The motion report corrects the older STYLE_BIBLE camera advice.

- Reference camera moves generally glide with symmetric acceleration/deceleration, roughly ten frames easing in and out, not three-frame snaps. The study measured typical peaks around 14–16 pixels/frame at 720x1280. Scale pixel comparisons for resolution; do not force the numbers into every shot.
- Quiet shots often use a small deliberate push. Avoid random handheld float. Impacts use short restrained kicks, roughly 6–8 frames, tied to the action.
- Walks have readable weight shifts and planted stance feet. The study found roughly 9–12 frames per step and 3–7% body-height bob in the reference examples. Adapt gait to actual travel distance/speed and anatomy; do not animate a walk while translating at an unrelated speed.
- Blinks have half/shut/shut/half shaping over about four frames, with natural gaps and blinks around expression changes. Expressions should be crisp and motivated; dissolves can double facial lines.
- Acting tends to land at or just before the spoken beat, approximately 0–3 frames. Anticipation, action, consequence and reaction must be visible.
- Keep formations/extras quiet when the camera or primary action carries a beat. Constant synchronized idle movement makes the world artificial.
- Prefer coherent furnished rooms, streets and scale, strong foreground/background separation, shaped warm/cool lighting, clear material detail and convincing contact. Darkness must retain the information needed for the story.
- Single-word outlined captions typically sit around 60–74% of frame height. They must not obscure the critical action.

## V2-specific technical cautions

The approved adult drawing uses a 500x550 design canvas, ground near y=480, and a 1.52-metre card in this episode. The story kitten uses its own 420x520 drawing and 0.79-metre card. Keep their relative scale stable.

A planted world foot projected onto one flat body card can end up below the actual floor and disappear through depth testing. The active adult walk rig uses separate world-anchored leg cards and toe/hip texture landmarks. Do not replace this with translating entire limbs inside the body texture. Gaits restart per walking bout so a reversal after a pause does not inherit planted feet facing the old direction.

The CPU Canvas adapter uses an explicit rasterization mode to keep repeated frames independent of readback/backend changes. Keep body/head transforms and `contacts.ts` mouth landmarks synchronized when altering prop interactions.

The references include Roblox characters, but the user approved illustrated cats. Preserve their drawings, markings, palettes and expressive views. Improve animation, composition, materials and lighting within the approved aesthetic.
