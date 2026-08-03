#!/bin/sh

set -eu

if [ "$#" -ne 1 ]; then
  echo "usage: $0 https://deployment.example" >&2
  exit 64
fi

base_url=${1%/}
failed=0

check_status() {
  path=$1
  expected=$2
  actual=$(curl --location --silent --show-error \
    --output /dev/null --write-out '%{http_code}' \
    --max-time 30 "${base_url}${path}") || actual="curl-error"

  if [ "$actual" = "$expected" ]; then
    printf 'ok   %s%s -> %s\n' "$base_url" "$path" "$actual"
  else
    printf 'FAIL %s%s -> %s (expected %s)\n' \
      "$base_url" "$path" "$actual" "$expected" >&2
    failed=1
  fi
}

check_status / 200
check_status /timeline 200
check_status /explore 200
check_status /about 200
check_status /transparency 200
check_status /__delivery-smoke-missing__ 404

exit "$failed"
