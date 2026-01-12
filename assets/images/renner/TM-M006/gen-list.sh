#!/usr/bin/env bash
set -euo pipefail

DIR_NAME="$(basename "$PWD")"            # TM-M006
BASE_PATH="assets/images/renner/$DIR_NAME"
OUT="list.json"

shopt -s nullglob

# Match: T01_01.png / T07_02.jpeg / T07_02.jpg
files=(T??_??.png T??_??.jpeg T??_??.jpg)

# Natural sort
IFS=$'\n' files=($(printf "%s\n" "${files[@]}" | sort -V))
unset IFS

{
  echo "["
  first=1
  for f in "${files[@]}"; do
    base="${f%.*}"     # T01_01
    t="${base%%_*}"    # T01
    n="${base##*_}"    # 01
    n="${n#0}"         # 1
    [[ -z "$n" ]] && n=0

    [[ $first -eq 0 ]] && echo ","
    first=0

    printf '  {\n'
    printf '    "code": "%s %s",\n' "$t" "$n"
    printf '    "url": "%s/%s"\n' "$BASE_PATH" "$f"
    printf '  }'
  done
  echo
  echo "]"
} > "$OUT"

echo "Wrote $OUT"