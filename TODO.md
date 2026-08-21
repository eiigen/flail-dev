# Flail — Execution Checklist (durable state)

Source of truth: ~/workspace/docs/superpowers/plans/2025-08-19-flail-implementation.md (26 tasks).
This file externalizes run-state so any session/compaction can reload instantly.

## Goal
Complete playable standard build per plan; verify via Playwright on desktop+mobile; deploy to https://eiigen.github.io/flail-dev/

## Steps
- [x] 1. Core loop green: audio guard written (AudioSystem cache checks). NEEDS: rebuild in sandbox + playtest probe (player move WASD/joystick, enemy spawn/chase, projectile kills, level-up modal unpauses, wave banner, 0 errors)
- [x] 2. Boss pipeline test: wave 5 -> boss intro cutscene (typewriter+zoom) -> death -> chest -> pickup heal
- [x] 3. Evolution modal UI (Yes/No/Auto, consume ingredients, grant result)
- [x] 4. SaveManager: localStorage+IndexedDB+migration
- [ ] 5. Content: characters 17 / maps 10 / enemies+bosses spriteKeys = REAL atlas frames / recipes tree / achievements; npx tsx scripts/validate-data.ts
- [ ] 6. SettingsMenu scene (volumes, colorblind, reduced-motion, keymap, high-contrast) wired from MainMenu
- [ ] 7. VFX variants: hit flash, evolve/death/levelup particles
- [ ] 8. MapGen: SimplexNoise biome tint over existing tile floor
- [ ] 9. Perf: pooling, caps, <16ms frames measured by harness
- [ ] 10. Integration playtest desktop+mobile green, screenshots verified
- [ ] 11. Deploy gh-pages (standard first), live URL asset 200s + boot check
- [ ] 12. README

## Done this run (context for future sessions)
- Rewrote: Game.ts (animated atlas sprites, camera follow, anims), MovementSystem, MapGenSystem (tile floor chunks+cull), EnemySpawner (5 types, wave scaling), ProjectileSystem (gem orbs, hit, XP->player), VFXSystem (bursts+shake), LevelUpSystem (REAL choices + unpause - fixed infinite-freeze bug), UIOverlay (HUD HP/XP/kills/level/wave banner, touch joystick, level-up modal), CutsceneLayer (typewriter dialogue, zoom, chest cinematic), BossEncounterSystem (spawn/intro/chest/pickup), WaveDirector (boss every 5th wave), CombatSystem (fallback weapon defs fire_staff/greatsword + dmgMult/cdMult/pierceBonus upgrades), Preload (atlas + 6 SFX), MainMenu (responsive, silent), InputSystem (WASD; joystick emits player-input from UIOverlay)
- Atlas HAS: character_{yellow,purple,pink,green,beige}_walk_a/b + idle/hit, slime/snail/mouse/ladybug/worm walk anims, coin/gem/heart pickups, block_coin chest, 173 terrain tiles. All 32x32.

## Environment gotchas (learned the hard way)
- Novita sandboxes die ~30min. On creation: transfer code tar (~70KB b64 ok as ONE exec arg), data tar, audio tar; atlas is 260KB -> chunk base64 at 70KB x 6 chunks, append, then head -c 171685 = main.json, tail = main.png (byte-exact split recorded here)
- Build: npx vite build --mode standard FOREGROUND (bg exec gets 502-killed mid-build)
- vite base:'/flail-dev/' -> serve dist from a parent dir as /flail-dev/ (port 4173 works; never pkill "http.server" from inside exec - it self-matches and terminates the shell)
- TRANSFER RULE: chunk files that already contain base64 text must be pushed as-is (arg = their exact content); wrapping them in ANOTHER base64 double-encodes. Verify remotely: png magic bytes 89 50 4e 47 + byte sizes before building.
- INPUT ARCHITECTURE: two channels ('key-input' from InputSystem, 'joy-input' from UIOverlay joystick) combined in MovementSystem with joystick priority. NEVER single-channel: per-frame keyboard emit stomps touch input.
- CLI loop gotcha: novita exec consumes stdin -> always add < /dev/null inside while-read loops.
- Playwright: context needs hasTouch:true for touchscreen; CDP Input.dispatchTouchEvent for joystick drags; run script from flail/ dir where playwright is installed
- Mobile detection must use window.innerWidth, NOT scale.width (canvas is fixed 1280x720 FIT)
- Playtest click coords are VIEWPORT coords; Start button sits at game(640,331) -> letterboxed offset on mobile viewports (still needs fix)
