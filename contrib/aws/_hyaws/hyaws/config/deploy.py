import yaml

DEPLOY_DEF_FILE = './deploy.yml'

with open(DEPLOY_DEF_FILE, 'r', encoding='utf-8') as f:
    deploy_def = yaml.load(f.read(), Loader=yaml.CLoader)
