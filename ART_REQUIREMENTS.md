# FRAMEBREAK — Full-body character art handoff

## What exists and what this update can deliver

`public/art/solstice-crew.png` is a 1536 × 1024 image containing six 512 × 512 painted busts. It contains no legs, back views, separate limbs, textures, skeletons or animation frames. The boss atlas is four 627 × 627 busts. These images cannot supply convincing realistic full-body animation on their own.

The game continues to use the existing articulated Phaser rigs. This pass adjusts stature, torso/limb breadth, head proportions and portrait-based colors, and uses the same rig in every pose. These are stylized temporary combat graphics, not hyperrealistic models. Original portrait pixels are preserved; square cells are clipped in nested SVG viewports and contained without stretching in every UI context. No newly generated character replacement or new art download has been substituted.

## Character reference brief

Use the existing portraits as the primary face, outfit, hair, material and color reference. Lore measurements in `src/game/lore.ts` are creative design targets, not estimates inferred from the paintings.

| Pilot  | Target build                                                  | Identity details to retain                                                                     |
| ------ | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Vector | 181 cm / 79 kg; lean athletic, moderate muscle                | Brown skin, curly dark hair, collector goggles, gold scarf, green/ivory armor                  |
| Rook   | 218 cm / 158 kg; very tall, extremely muscular heavyweight    | Dark skin, close dark hair and beard, massive ivory/green armor, gold conduits, living vines   |
| Nyx    | 174 cm / 64 kg; slim, agile and lean                          | Brown skin, silver-violet hair, star jewelry, high prism collar, purple/ivory cloak            |
| Ember  | 166 cm / 56 kg; slim lightweight athlete                      | Tan skin, freckles, red hair/ponytail, orange solar wings, warm ivory/copper armor             |
| Solis  | 205 cm / 116 kg; muscular and imposing, more mobile than Rook | Dark skin, white locs and beard, gold collector halo, ivory/green solar mantle                 |
| Astra  | 186 cm / 74 kg; graceful, powerful lean athlete               | Olive skin, short navy hair, cyan-white armor, orbital head ornament, translucent tidal mantle |

## Required deliverables per fighter

1. **Approved reference sheet:** front, side, three-quarter and back full-body views; neutral face and expressions; unarmored anatomy/blockout beneath the same costume; consistent scale beside the other five fighters. Include two equipped signature weapons and special device views.
2. **Animation-ready character:** preferably a layered 2D cutout rig with separate head/hair, torso, pelvis, upper/lower arms, hands, upper/lower legs, boots, scarf/cape/solar wings, weapon sockets and collector effects. Supply transparent PNG layers and machine-readable pivots/bone hierarchy. The current Phaser containers can animate these without replacing the combat simulation.
3. **Alternative for more convincing realism:** a fully rigged and textured 3D source model, then offline render to transparent 2D sprite atlases. The browser remains 2D. Supply PBR source textures and rig/source files for future renders; a live 3D engine migration is not required or included in this update.
4. **Animation clips:** idle; start/run/stop; ground jump; each air jump; ascent/apex/fall; landing; drop-through; forward/back dodge; three-strike chain; up/diagonal/down aerials; hit reaction; guard; perfect parry; guard break; recovery ascent; weapon pickup; ring-out/respawn; win/loss. Add each signature's startup/active/recovery and each ultimate's windup/release/recovery. Ember needs distinct extra air-jump and Phoenix Dash wing poses. Astra needs held orbit and aimed release. Rook needs planted armor and both fists raised → ground impact for Cataclysm.
5. **Timing/attachment metadata:** stable foot anchor, visual bounds, named weapon and effect sockets, frame times, loop markers, active/recovery markers, and atlas frame rectangles. Visual markers must follow simulation timings; art must not determine damage or cooldowns. Keep mirrored-facing costume details intentional.
6. **FX layers:** beam collector, separate star projectiles, armor/shockwave/debris, phoenix afterimages, dark eclipse + corona, water orb/vortex, and distinct ultimate layers. Separate core hit indicators from optional particles for reduced motion.

## Browser delivery targets

Start with one complete pilot, Vector, to validate quality at the actual 1200 × 680 arena scale before producing the roster. Design visible detail for about 100–150 world-unit character height; avoid spending texture memory on invisible facial detail. Aim initially for 256-pixel-high frames, 12–24 authored frames per second with time-based playback, and 2048 × 2048 atlases grouped by fighter/weapon. Trim transparent borders while preserving anchor metadata. Deliver lossless source images and visually checked WebP/PNG runtime exports. Measure decoded texture memory as well as download size; lazy-load selected fighters if atlases exceed the current small scene budget.

Keep consistent anatomy across all clips. Do not stretch a bust into a body, invent low-quality missing limbs from one portrait, or represent a static full-body picture as an animated replacement. Obtain ownership/license and attribution details with any commissioned or external assets before bundling them. No account, paid tool or sign-up is required to play this update; additional art production is a separate deliverable.
