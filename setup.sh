#!/usr/bin/env bash
set -e
cd /home/user/flail || exit 1
echo "==[1/8] npm install=="
npm install > /home/user/log_npm.txt 2>&1 || { echo "NPM_FAIL"; tail -5 /home/user/log_npm.txt; exit 1; }
echo "==[2/8] download asset packs=="
mkdir -p assets_dl src/assets/raw
cd assets_dl
for f in kenney_new-platformer-pack-1.0.zip Pack_AH_16x16.zip Pack_AH_RMMV.zip; do
  [ -s "$f" ] || curl -s -L -o "$f" "https://opengameart.org/sites/default/files/$f"
done
cd /home/user/flail
echo "==[3/8] extract to raw=="
python3 - <<'PY'
import zipfile, os
def extract(z, out):
    with zipfile.ZipFile(z) as zf:
        for name in zf.namelist():
            if name.endswith("/"):
                # also copy empty dirs? skip
                continue
            target = os.path.join(out, name)
            os.makedirs(os.path.dirname(target), exist_ok=True)
            with zf.open(name) as src, open(target, "wb") as dst:
                dst.write(src.read())
for z, out in [
    ("assets_dl/kenney_new-platformer-pack-1.0.zip", "src/assets/raw/kenney"),
    ("assets_dl/Pack_AH_16x16.zip", "src/assets/raw/ah16"),
    ("assets_dl/Pack_AH_RMMV.zip", "src/assets/raw/ahrmmv"),
]:
    extract(z, out)
print("extracted", len(os.listdir("assets_dl")))
PY
echo "==[4/8] normalize=="
npx tsx scripts/normalize-assets.ts > /home/user/log_norm.txt 2>&1 || echo "NORM_WARN (see log)"
echo "==[5/8] atlas=="
npx tsx scripts/atlas.ts > /home/user/log_atlas.txt 2>&1 || echo "ATLAS_WARN (see log)"
echo "==[6/8] stage public/assets=="
P=public/assets
mkdir -p $P/atlases $P/data $P/audio $P/fonts
cp -f assets/atlases/main.png assets/atlases/main.json $P/atlases/ 2>/dev/null || true
cp -f src/data/*.json $P/data/ 2>/dev/null || true
SD=src/assets/raw/kenney/Sounds
[ -f "$SD/sfx_select.ogg" ] && cp -f "$SD/sfx_select.ogg" $P/audio/music_menu.ogg || true
[ -f "$SD/sfx_coin.ogg" ] && cp -f "$SD/sfx_coin.ogg" $P/audio/player_hit.ogg || true
[ -f "$SD/sfx_jump.ogg" ] && cp -f "$SD/sfx_jump.ogg" $P/audio/player_attack.ogg || true
[ -f "$SD/sfx_hurt.ogg" ] && cp -f "$SD/sfx_hurt.ogg" $P/audio/enemy_hit.ogg || true
[ -f "$SD/sfx_magic.ogg" ] && cp -f "$SD/sfx_magic.ogg" $P/audio/levelup.ogg || true
[ -f "$SD/sfx_gem.ogg" ] && cp -f "$SD/sfx_gem.ogg" $P/audio/coin.ogg || true
[ -f "$SD/sfx_bump.ogg" ] && cp -f "$SD/sfx_bump.ogg" $P/audio/evolve.ogg || true
echo '{"fonts":{"CinzelDecorative":{"css":[],"src":[]},"Cinzel":{"css":[],"src":[]},"PressStart2P":{"css":[],"src":[]}}}' > $P/fonts/manifest.json
find $P -type f | wc -l
echo "==[7/8] build standard=="
npx vite build --mode standard > /home/user/log_build.txt 2>&1 || { echo "BUILD_FAIL"; tail -5 /home/user/log_build.txt; exit 1; }
echo "==[8/8] playwright=="
npm install playwright > /home/user/log_pw.txt 2>&1 || true
npx playwright install chromium --with-deps > /home/user/log_brw.txt 2>&1 || true
echo "SETUP_DONE"
