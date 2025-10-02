try:
    import backend.app
    print('App imported successfully')
    print('Available routes:')
    for route in backend.app.app.routes:
        if hasattr(route, 'methods'):
            print(f'{route.methods} {route.path}')
except Exception as e:
    print('Import failed:', e)
    import traceback
    traceback.print_exc()
