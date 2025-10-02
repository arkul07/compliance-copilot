import sys
import importlib

# Clear any cached modules
def clear_cache():
    keys_to_remove = [k for k in sys.modules.keys() if k.startswith('backend')]
    for k in keys_to_remove:
        del sys.modules[k]

clear_cache()

try:
    import backend.app
    print('Routes:')
    for route in backend.app.app.routes:
        if hasattr(route, 'methods'):
            print(f'{route.methods} {route.path}')
except Exception as e:
    print('Error:', e)
    import traceback
    traceback.print_exc()
