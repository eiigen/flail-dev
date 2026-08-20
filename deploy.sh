#!/usr/bin/env bash
# Publish dist/standard to GitHub Pages for eiigen/flail-dev
set -e
cd "$(dirname "$0")"
BR=gh-pages
echo "==[1/4] pull latest (assets + code) =="
git pull origin master --no-rebase 2>&1 | tail -1 || true
echo "==[2/4] ensure dist/standard built =="
if [ ! -d dist/standard ] || [ ! -f dist/standard/index.html ]; then
  echo "dist/standard missing — will use gh-pages from repo if present"
fi
echo "==[3/4] publish gh-pages branch from dist/standard =="
if [ -d dist/standard ]; then
  SRC=dist/standard
else
  echo "no dist/standard; nothing to publish"; exit 1
fi
# Build a gh-pages branch from dist/standard contents
TMP="$PWD/.pages_tmp"
rm -rf "$TMP"; mkdir -p "$TMP"
cp -r "$SRC"/. "$TMP"/
cd "$TMP"
git init -q
git checkout -qb "$BR"
git add -A
git -c user.email=agent@storystudio.app -c user.name=eiigen commit -qm "gh-pages build $(date -u +%FT%TZ)"
cd ..
git fetch origin "$BR" 2>/dev/null && git update-ref refs/heads/$BR "$TMP"
git push -f origin "$BR" 2>&1 | tail -2
rm -rf "$TMP"
echo "==[4/4] enable Pages =="
gh api repos/eiigen/flail-dev/pages -X POST -f source[branch]=$BR -f source[path]="/" 2>&1 | tail -2 || \
gh api repos/eiigen/flail-dev/pages -X PUT -f source[branch]=$BR -f source[path]="/" 2>&1 | tail -2 || true
echo "DONE"
