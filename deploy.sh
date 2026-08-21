#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
BR=gh-pages
SRC="$PWD/dist/standard"
TMP="$PWD/.pages_tmp"
rm -rf "$TMP"; mkdir -p "$TMP"
cp -r "$SRC"/. "$TMP"/
cd "$TMP"
git init -q
git config user.email agent@storystudio.app
git config user.name eiigen
git add -A
git commit -qm "gh-pages build"
cd "$PWD"
# force-create the gh-pages branch from the temp commit's tree
GHP_TREE=$(git --git-dir="$TMP/.git" rev-parse HEAD^{tree})
GHP_MSG="gh-pages deploy"
GHP_COMMIT=$(git -c user.email=agent@storystudio.app -c user.name=eiigen commit-tree "$GHP_TREE" -m "$GHP_MSG")
echo "gh-pages commit: $GHP_COMMIT"
git push -f origin "$GHP_COMMIT:refs/heads/$BR" 2>&1 | tail -3
rm -rf "$TMP"
git fetch origin "$BR" --depth=1 2>&1 | tail -1
echo "PUSHED_GH_PAGES"
