#!/usr/bin/env bash
set -Eeuo pipefail

log(){ echo -e "\033[1;34m[setup]\033[0m $*"; }
err(){ echo -e "\033[1;31m[error]\033[0m $*" >&2; exit 1; }

command -v python3 >/dev/null 2>&1 || err "python3 not found. Install Python 3.10+ from https://www.python.org/downloads/."

PYVER=$(python3 - <<'PY'
import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")
PY
)
MAJ=${PYVER%%.*}; MIN=${PYVER#*.}
if [ "$MAJ" -lt 3 ] || [ "$MIN" -lt 10 ]; then err "Python >=3.10 required, found $PYVER"; fi

log "Creating virtual environment at .venv"
python3 -m venv .venv
# shellcheck disable=SC1091
source .venv/bin/activate

log "Upgrading pip/setuptools/wheel"
python -m pip install --upgrade pip setuptools wheel

log "Installing Python dependencies"
pip install -r requirements.txt

log "Running sanity check"
python sanity_check.py || err "Sanity check failed"

log "All set. Next steps:"
echo "  source .venv/bin/activate"
echo "  uvicorn backend.app:app --reload"
echo "  streamlit run ui/app.py"

