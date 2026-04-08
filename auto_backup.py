from __future__ import annotations

import os
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parent
LOCK_FILE = REPO_ROOT / "auto_backup.lock"
LOG_FILE = REPO_ROOT / "auto_backup.log"
POLL_SECONDS = 5
IDLE_SECONDS = 45
EXCLUDED_DIRS = {".git", "node_modules", "__pycache__"}
EXCLUDED_FILES = {"auto_backup.log", "auto_backup.lock"}


def log(message: str) -> None:
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{timestamp}] {message}"
    print(line, flush=True)
    with LOG_FILE.open("a", encoding="utf-8") as handle:
        handle.write(line + "\n")


def run_git(*args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["git", *args],
        cwd=REPO_ROOT,
        text=True,
        capture_output=True,
        check=False,
    )


def is_dirty() -> bool:
    result = run_git("status", "--porcelain")
    return bool(result.stdout.strip())


def snapshot() -> dict[str, tuple[int, int]]:
    state: dict[str, tuple[int, int]] = {}
    for path in REPO_ROOT.rglob("*"):
        if not path.is_file():
            continue
        if any(part in EXCLUDED_DIRS for part in path.parts):
            continue
        if path.name in EXCLUDED_FILES:
            continue
        stat = path.stat()
        state[str(path.relative_to(REPO_ROOT))] = (stat.st_mtime_ns, stat.st_size)
    return state


def commit_and_push() -> None:
    run_git("add", "-A")
    if not is_dirty():
        return

    message = "backup: " + datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    commit = run_git("commit", "-m", message)
    if commit.returncode != 0:
        log("commit skipped: " + (commit.stderr or commit.stdout).strip())
        return

    push = run_git("push")
    if push.returncode != 0:
        log("push failed: " + (push.stderr or push.stdout).strip())
        return

    log(f"backup committed and pushed: {message}")


def main() -> int:
    if LOCK_FILE.exists():
        log("auto backup already running")
        return 0

    LOCK_FILE.write_text(str(os.getpid()), encoding="utf-8")
    log("auto backup watcher started")
    last_snapshot = snapshot()
    last_change = time.time()

    try:
        while True:
            time.sleep(POLL_SECONDS)
            current_snapshot = snapshot()
            if current_snapshot != last_snapshot or is_dirty():
                last_snapshot = current_snapshot
                last_change = time.time()

            if is_dirty() and time.time() - last_change >= IDLE_SECONDS:
                commit_and_push()
                last_snapshot = snapshot()
                last_change = time.time()
    except KeyboardInterrupt:
        log("auto backup watcher stopped")
        return 0
    finally:
        if LOCK_FILE.exists():
            LOCK_FILE.unlink(missing_ok=True)


if __name__ == "__main__":
    sys.exit(main())
