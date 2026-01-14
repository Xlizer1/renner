#!/usr/bin/env bash
set -euo pipefail

# Run this inside: assets/images/renner/CHROMA
# Builds list.json from files like RC_1000.png
# Output item:
# { "code": "RC 1000", "url": "assets/images/renner/CHROMA/RC_1000.png" }

DIR_NAME="$(basename "$PWD")" # CHROMA
BASE_PATH="assets/images/renner/$DIR_NAME"
OUT="list.json"

shopt -s nullglob

files=(RC_*.png RC_*.jpg RC_*.jpeg)

# Keep only RC_####.(png|jpg|jpeg) and sort naturally
IFS=$'\n' files=($(
  printf "%s\n" "${files[@]}" \
    | grep -E '^RC_[0-9]{4}\.(png|jpe?g)$' \
    | sort -V
))
unset IFS

{
  echo "["
  first=1

  for f in "${files[@]}"; do
    base="${f%.*}"          # RC_1000
    prefix="${base%%_*}"    # RC
    num="${base##*_}"       # 1000

    [[ $first -eq 0 ]] && echo ","
    first=0

    printf '  {\n'
    printf '    "code": "%s %s",\n' "$prefix" "$num"
    printf '    "url": "%s/%s"\n' "$BASE_PATH" "$f"
    printf '  }'
  done

  echo
  echo "]"
} > "$OUT"

echo "Wrote $OUT with ${#files[@]} entries."