"""All of hyaws's "profanities" are contained inside this file"""

import sys

import colorama

colorama.init()

# Thanks, Blender
class bcolors:  # noqa
    CLEAR_SCREEN = '\033[2J'
    CLEAR_LINE = '\033[2K'

    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'


DEFAULT_USER_DESCRIPTION = 'the wretched, unable to comprehend how c00l iz teh cloud'


def color_print(color, text, **kwargs):
    print(color + text + bcolors.ENDC, file=sys.stderr, **kwargs)


def print_home():
    from hyaws.config import get_accounts
    from hyaws.config.credentials import CREDENTIALS_FILE

    color_print(bcolors.BOLD, f'Welcome to hyaws - because ehm... {bcolors.OKBLUE}"HARMONY + AWS = FUN!"\n')

    color_print(bcolors.WARNING, 'Checking accounts...\r', end='', flush=True)
    accounts, missing = get_accounts()

    if len(accounts) == len(missing) == 0:
        color_print(bcolors.FAIL + bcolors.BOLD, f'No accounts here! But... where is my "{CREDENTIALS_FILE}" file?')
        return

    _print_accounts(accounts, missing)
    _print_services()


def print_credentials_error(name, error):
    from .config.credentials import CREDENTIALS_FILE

    color_print(bcolors.FAIL, f'Whoops, the "{name}" account in your "{CREDENTIALS_FILE}" file is acting weird...\n'
                               'and I am still not smart enough to steal passwords from the Marette team!\n')

    color_print(bcolors.HEADER, f'What happened:\n{str(error)}\n')

    color_print(bcolors.WARNING, '...but have no fear, just take a look at the README file '
                                  'and you\'ll become an AWS guru in no time (sigh)\n')


def print_unknown_service_name(service_name):
    color_print(bcolors.FAIL, f'Sounds strange, but AWS still doesn\'t have a service named "{service_name}"')


def print_unknown_service_command(service_name, command_name):
    color_print(bcolors.FAIL, f'Aww shite, "{service_name}" does not have a command named "{command_name}"')


def print_missing_service_command_accounts(accounts):
    color_print(bcolors.FAIL, f'This command requires you to be logged in with the following account(s): {accounts}')


def _print_accounts(accounts, missing):
    color_print(bcolors.HEADER, bcolors.CLEAR_LINE + 'Your accounts:')
    for name, account in accounts.items():
        color_print(bcolors.OKGREEN, ' ✔ %-12s  (%s)' % (name, account.description))
    for sect in missing:
        color_print(bcolors.FAIL, f' ✘ [{sect}]')

    print()


def _print_services():
    from .config import deploy_def
    from .config.deploy import DEPLOY_DEF_FILE

    services = deploy_def['services'].keys()

    if len(services) == 0:
        color_print(bcolors.WARNING,
                     f'...and of course you can\'t use nothing (hint: edit the "{DEPLOY_DEF_FILE}" file)')
        return

    color_print(bcolors.HEADER, 'And here\'s a list of shit you can use:')
    for s in services:
        color_print(bcolors.OKBLUE, ' • ' + s)

    print('\nSo call me again using %shyaws <shit_name> [help]%s' % (bcolors.WARNING, bcolors.ENDC), file=sys.stderr)
