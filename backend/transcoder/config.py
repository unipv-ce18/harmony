from os.path import realpath, dirname
import json


cfg_rabbitmq_path = realpath(dirname(__file__) + '/resources/config_rabbitmq.json')
with open(cfg_rabbitmq_path, 'r') as f:
    config_rabbitmq = json.load(f)
