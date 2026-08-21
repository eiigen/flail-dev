# Flail

A Vampire Survivors-like top-down pixel arcade game for web browsers.
Built with Phaser 3 + TypeScript + Vite.

**Play:** https://eiigen.github.io/flail-dev/

## Quick Start

```bash
pnpm install
npx vite build --mode standard   # or: npm run build:standard
npx vite preview                 # serve dist/
```

## Controls

| Action | Desktop | Mobile |
|---|---|---|
| Move | WASD | left-side virtual joystick |
| Pick level-up | click / `1` `2` `3` | tap a card |
| Evolve? | `Y` / `N` | tap YES/NO |

## Features

- Animated atlas sprites (5 character rigs, 22 enemy types with walk anims)
- Auto-attack combat with projectiles, damage upgrades, pierce
- XP → level-up choices (Vitality / Power / Swiftness / Haste / Piercing)
- Ingredient drops → recipe evolution tree (Z → ZZ → ZZZ tiers, 19 recipes)
- Wave director with difficulty scaling; boss every 5th wave with typewriter intro cutscene, chest reward cinematic
- Procedural biome terrain (seeded simplex noise), chunked + baked to RenderTextures
- Save/load: localStorage + IndexedDB mirror with migration
- Settings: volumes, color-blind modes, reduced motion, high contrast, key remap
- Touch joystick; FIT-scaled responsive canvas

## Build

```bash
npm run build:standard   # dist/standard
npm run build:polli      # dist/polli (feature-flagged Polli version)
```

## Asset Pipeline

```bash
npm run assets:process   # normalize + slice + atlas
npm run atlas            # TexturePacker only
npx tsx scripts/validate-data.ts
```

## Tech

ECS-lite core (World/Entity/Component/System/Query) · Zod-validated data layer ·
SpatialHash targeting · seeded SimplexNoise biomes · Playwright probe suite (`probe*.cjs`, `playtest_full.cjs`)
