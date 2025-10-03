import importlib, sys
print("Python:", sys.version)
packages = [
    ("fastapi", "FastAPI"),
    ("uvicorn", "uvicorn"),
    ("pydantic", "pydantic"),
    ("dotenv", "python-dotenv"),
    ("httpx", "httpx"),
    ("streamlit", "streamlit"),
    ("landingai", "landingai"),
    ("pathway", "pathway"),
    ("pypdf", "pypdf"),
]
for mod, name in packages:
    try:
        m = importlib.import_module(mod)
        ver = getattr(m, "__version__", getattr(getattr(m, "__about__", object), "__version__", "?"))
        print(f"OK  - {name:15s} v{ver}")
    except Exception as e:
        print(f"FAIL- {name:15s} -> {e}")
        raise
print("Sanity check passed.")

