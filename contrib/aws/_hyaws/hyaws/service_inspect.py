from importlib import import_module
from inspect import getmembers, isfunction


COMMAND_PREFIX = 'command_'


def load_service_module(service_name):
    return import_module(f'.services.{service_name}', __name__.rsplit('.', 1)[0])


def get_service_commands(service_module):
    return {
        _get_command_name(fn_name): fn
        for fn_name, fn in getmembers(service_module,
                                      lambda f: isfunction(f) and f.__name__.startswith(COMMAND_PREFIX))
    }


def _get_command_name(fn_name):
    return fn_name.replace(COMMAND_PREFIX, '').replace('_', '-')
