"""Hourly SSH temperature monitor. Uses only the Python standard library."""

import json
import math
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile


THRESHOLD_C = 50.0


def required(name):
    value = os.environ.get(name, "").strip()
    if not value:
        raise ValueError(f"Missing setting: {name}")
    return value


def read_sensors():
    host = required("SERVER_HOST")
    user = required("SERVER_USER")
    # Use the same SSH credentials and port as deploy-ec2.yml.
    port = 22
    if not re.fullmatch(r"[a-zA-Z0-9_.:-]+", host) or host.startswith("-"):
        raise ValueError("SERVER_HOST must be a hostname or IP address")
    if not re.fullmatch(r"[a-zA-Z0-9_][a-zA-Z0-9_.-]*", user):
        raise ValueError("Invalid SERVER_USER")

    with tempfile.TemporaryDirectory(prefix="temperature-ssh-") as directory:
        key = Path(directory) / "key"
        known_hosts = Path(directory) / "known_hosts"
        key.write_text(required("SERVER_SSH_KEY") + "\n", encoding="utf-8")
        known_hosts.touch(mode=0o600)
        key.chmod(0o600)
        known_hosts.chmod(0o600)
        result = subprocess.run(
            [
                "ssh", "-F", "/dev/null", "-T", "-i", str(key),
                "-p", str(port), "-l", user,
                "-o", "BatchMode=yes",
                "-o", "IdentitiesOnly=yes",
                "-o", "StrictHostKeyChecking=accept-new",
                "-o", f"UserKnownHostsFile={known_hosts}",
                "-o", "ConnectTimeout=15",
                "-o", "ServerAliveInterval=10",
                "-o", "ServerAliveCountMax=2",
                host, "LC_ALL=C sensors -j",
            ],
            capture_output=True, text=True, timeout=60, check=False,
        )
        if result.returncode != 0:
            # Do not print connection details or arbitrary remote stderr to CI logs.
            raise RuntimeError(
                f"SSH/sensors failed (exit {result.returncode}). "
                "Check SSH access, host key, and sensors installation."
            )
        return result.stdout


def temperatures(raw):
    data = json.loads(raw)
    readings = []

    def visit(node, path):
        if not isinstance(node, dict):
            return
        for key, value in node.items():
            if re.fullmatch(r"temp\d+_input", key):
                if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
                    raise ValueError("Invalid temperature reading")
                readings.append((" / ".join((*path, key)), float(value)))
            elif isinstance(value, dict):
                visit(value, (*path, key))

    visit(data, ())
    if not readings:
        raise ValueError("No temperature readings found in sensors output")
    return readings


def report_error(message):
    escaped = message.replace("%", "%25").replace("\r", "%0D").replace("\n", "%0A")
    print(f"::error::{escaped}")


def main():
    try:
        readings = temperatures(read_sensors())
    except Exception as error:
        report_error(
            f"Temperature check failed ({type(error).__name__}). "
            "Check the workflow secrets, SSH connectivity/host key, and sensors -j on the server."
        )
        return 1

    maximum = max(value for _, value in readings)
    print(f"Checked {len(readings)} temperature sensors; maximum={maximum:.1f} C")
    hot = [(label, value) for label, value in readings if value > THRESHOLD_C]
    if hot:
        report_error(f"Server temperature exceeded {THRESHOLD_C:.0f} C; maximum={maximum:.1f} C.")
        for label, value in hot:
            report_error(f"{label}: {value:.1f} C")
        return 1
    print("Temperature is within the limit.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
