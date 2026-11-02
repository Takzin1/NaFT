#!/usr/bin/env bash
# Deterministic NaFT browser smoke bootstrap for Ubuntu GitHub Actions.
# Chrome CDP occasionally fails to initialize with a shared fixed profile,
# especially when concurrent PR/push jobs start together. Retry the launcher,
# not failed functional assertions; never mask test failures.
set -euo pipefail
cd "$(dirname "$0")/.."

chrome="$(command -v google-chrome-stable || command -v google-chrome || command -v chromium || command -v chromium-browser || true)"
if [[ -z "$chrome" ]]; then
  echo "::error::Chromium/Chrome executable not found"
  exit 1
fi

tmp_base="${RUNNER_TEMP:-${TMPDIR:-/tmp}}"
http_log="$(mktemp "$tmp_base/naft-http.XXXXXX.log")"
chrome_log="$(mktemp "$tmp_base/naft-chrome.XXXXXX.log")"
server_pid=''
chrome_pid=''
profile_dir=''
cleanup_chrome() {
  if [[ -n "$chrome_pid" ]]; then
    kill "$chrome_pid" 2>/dev/null || true
    wait "$chrome_pid" 2>/dev/null || true
    chrome_pid=''
  fi
  if [[ -n "$profile_dir" ]]; then
    # Chromium forks children that may briefly recreate Default/ after the
    # parent exits. Retry cleanup without replacing a real test's exit status.
    profile_removed=false
    for i in 1 2 3 4; do
      if rm -rf -- "$profile_dir" 2>/dev/null; then
        profile_removed=true
        break
      fi
      sleep 0.25
    done
    if [[ "$profile_removed" != true ]]; then
      echo "::warning::Chrome profile cleanup deferred to ephemeral runner: $profile_dir"
    fi
    profile_dir=''
  fi
}
cleanup() {
  cleanup_chrome
  if [[ -n "$server_pid" ]]; then
    kill "$server_pid" 2>/dev/null || true
    wait "$server_pid" 2>/dev/null || true
  fi
  rm -f -- "$http_log" "$chrome_log" || true
  return 0
}
trap cleanup EXIT

python3 -m http.server 4173 --bind 127.0.0.1 >"$http_log" 2>&1 &
server_pid=$!
server_ready=false
for i in {1..60}; do
  if curl --silent --fail --max-time 1 http://127.0.0.1:4173/naft-app.html >/dev/null; then
    server_ready=true
    break
  fi
  if ! kill -0 "$server_pid" 2>/dev/null; then break; fi
  sleep 0.25
done
if [[ "$server_ready" != true ]]; then
  echo "::error::NaFT HTTP server failed to start"
  cat "$http_log" || true
  exit 1
fi

cdp_ready=false
for attempt in 1 2; do
  profile_dir="$(mktemp -d "$tmp_base/naft-chrome-profile.XXXXXX")"
  : >"$chrome_log"
  env -u DBUS_SESSION_BUS_ADDRESS "$chrome" \
    --headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage \
    --no-first-run --no-default-browser-check \
    --remote-debugging-address=127.0.0.1 --remote-debugging-port=9222 \
    --user-data-dir="$profile_dir" \
    "http://127.0.0.1:4173/naft-app.html#/reviewer-demo" \
    >"$chrome_log" 2>&1 &
  chrome_pid=$!
  for i in {1..100}; do
    if curl --silent --fail --max-time 1 http://127.0.0.1:9222/json/list >/dev/null; then
      cdp_ready=true
      break
    fi
    if ! kill -0 "$chrome_pid" 2>/dev/null; then
      break
    fi
    sleep 0.25
  done
  if [[ "$cdp_ready" == true ]]; then break; fi
  echo "::warning::Chrome DevTools did not start (attempt $attempt/2)"
  tail -n 40 "$chrome_log" || true
  cleanup_chrome
done

if [[ "$cdp_ready" != true ]]; then
  echo "::error::Chrome DevTools endpoint did not become ready after two isolated-profile attempts"
  echo "--- Chrome log ---"
  cat "$chrome_log" || true
  echo "--- HTTP log ---"
  cat "$http_log" || true
  exit 1
fi

# These are correctness tests. Never retry or suppress their assertion failures.
node tests/browser-reviewer-smoke.mjs
node tests/browser-gikuten-smoke.mjs
