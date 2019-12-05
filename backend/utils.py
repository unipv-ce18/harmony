from os.path import realpath, dirname
import json


def read_json(path):
    with open(path, 'r') as f:
        data = f.read()
    json_data = json.loads(data, strict=False)
    if isinstance(json_data, dict):
        return [json_data]
    return json_data
