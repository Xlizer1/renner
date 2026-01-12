#!/usr/bin/env bash
set -euo pipefail

# Generates list.json for the CS folder from files like:
# CS001_BIANCO_GHIACCIO.png
# Output item:
# { "code": "CS001", "name": "BIANCO GHIACCIO", "url": "assets/images/renner/CS/CS001_BIANCO_GHIACCIO.png" }

DIR_NAME="$(basename "$PWD")" # CS
BASE_PATH="assets/images/renner/$DIR_NAME"
OUT="list.json"

shopt -s nullglob

files=(CS*.png CS*.jpg CS*.jpeg)

# Keep only files that match CS + 3 digits + "_" + name + ext, and sort by number
IFS=$'\n' files=($(
  printf "%s\n" "${files[@]}" \
    | grep -E '^CS[0-9]{3}_.+\.(png|jpe?g)$' \
    | sort -V
))
unset IFS

{
  echo "["
  first=1

  for f in "${files[@]}"; do
    base="${f%.*}"              # CS001_BIANCO_GHIACCIO
    code="${base%%_*}"          # CS001
    name_part="${base#*_}"      # BIANCO_GHIACCIO
    name="${name_part//_/ }"    # BIANCO GHIACCIO

    [[ $first -eq 0 ]] && echo ","
    first=0

    printf '  {\n'
    printf '    "code": "%s %s",\n' "$code" "$name"
    printf '    "url": "%s/%s"\n' "$BASE_PATH" "$f"
    printf '  }'
  done

  echo
  echo "]"
} > "$OUT"

echo "Wrote $OUT with ${#files[@]} entries."