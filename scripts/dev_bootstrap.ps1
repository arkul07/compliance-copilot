Param()
$ErrorActionPreference = "Stop"
function Log($m){ Write-Host "[setup] $m" -ForegroundColor Cyan }
function Die($m){ Write-Host "[error] $m" -ForegroundColor Red; exit 1 }

# Try to find Python
$pyCmd = "python"
try { $v = & $pyCmd -c "import sys;print(f'{sys.version_info.major}.{sys.version_info.minor}')" } catch { $pyCmd = "py"; $v = & $pyCmd -3 -c "import sys;print(f'{sys.version_info.major}.{sys.version_info.minor}')" }
if (-not $v) { Die "Python 3.10+ not found. Install from https://www.python.org/downloads/" }
$parts = $v.Split('.')
if ([int]$parts[0] -lt 3 -or [int]$parts[1] -lt 10) { Die "Python >=3.10 required, found $v" }

Log "Creating virtual environment at .venv"
& $pyCmd -m venv .venv
. .\.venv\Scripts\Activate.ps1

Log "Upgrading pip/setuptools/wheel"
python -m pip install --upgrade pip setuptools wheel

Log "Installing Python dependencies"
pip install -r requirements.txt

Log "Running sanity check"
python sanity_check.py

Log "All set. Next steps:"
Write-Host "  .\\.venv\\Scripts\\Activate.ps1" -ForegroundColor Gray
Write-Host "  uvicorn backend.app:app --reload" -ForegroundColor Gray
Write-Host "  streamlit run ui/app.py" -ForegroundColor Gray

