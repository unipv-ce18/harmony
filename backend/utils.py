from os.path import realpath, dirname
import json


cfg_file_path = realpath(dirname(__file__) + '/resources/config.json')
with open(cfg_file_path, 'r') as f:
    config = json.load(f)


cfg_storage_path = realpath(dirname(__file__) + '/resources/config_storage.json')
with open(cfg_storage_path, 'r') as f:
    config_storage = json.load(f)



def read_json(path):
    with open(path, 'r') as f:
        data = f.read()
    json_data = json.loads(data, strict=False)
    if isinstance(json_data, dict):
        return [json_data]
    return json_data
