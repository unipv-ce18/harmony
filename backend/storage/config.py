from os.path import realpath, dirname
import json


cfg_storage_path = realpath(dirname(__file__) + '/resources/config_storage.json')
with open(cfg_storage_path, 'r') as f:
    config_storage = json.load(f)
