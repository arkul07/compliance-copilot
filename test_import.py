try:
    import backend.pathway_pipeline as pw
    print('Import successful')
    print(dir(pw))
except Exception as e:
    print('Import failed:', e)

