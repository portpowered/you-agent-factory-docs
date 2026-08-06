#!/bin/sh
# you-agent-factory installer shim.
#
# The homepage advertises `curl -fsSL https://youagentfactory.com/install.sh | sh`,
# but nothing was ever published at that path, so the command 404'd and piped an
# empty body into sh — which exits 0 and installs nothing. This file is that
# missing target.
#
# It does not install anything itself. It fetches the installer attached to the
# newest GitHub release and runs it, so the short URL always tracks the current
# version without this file needing to know which one that is.
set -eu

RELEASE_INSTALLER="https://github.com/portpowered/you-agent-factory/releases/latest/download/install.sh"

if command -v curl >/dev/null 2>&1; then
  fetch() { curl -fsSL "$1"; }
elif command -v wget >/dev/null 2>&1; then
  fetch() { wget -qO- "$1"; }
else
  echo "you-agent-factory installer: needs curl or wget on PATH." >&2
  exit 1
fi

# Buffer to a file rather than piping straight into sh: a truncated download
# piped to a shell runs whatever prefix arrived, which is the failure mode this
# file exists to fix.
installer="$(mktemp)"
trap 'rm -f "$installer"' EXIT INT TERM

if ! fetch "$RELEASE_INSTALLER" >"$installer"; then
  echo "you-agent-factory installer: could not download $RELEASE_INSTALLER" >&2
  exit 1
fi

if [ ! -s "$installer" ]; then
  echo "you-agent-factory installer: $RELEASE_INSTALLER returned an empty body." >&2
  exit 1
fi

sh "$installer" "$@"
