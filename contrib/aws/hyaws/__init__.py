import sys

from . import cli
from .config import deploy_def
from .service_inspect import load_service_module, get_service_commands


def main():
    # No arguments, show user/services and exit
    if len(sys.argv) == 1:
        cli.print_home()
        sys.exit(0)

    svc = sys.argv[1]

    # User asked for help about a service
    if svc == 'help':
        svc_name = sys.argv[2] if len(sys.argv) > 2 else None
        show_help(svc_name)
        sys.exit(0)

    # Check if the service is in our "deploy.yml"
    if svc not in deploy_def['services']:
        cli.print_unknown_service_name(svc)
        sys.exit(1)

    svc_commands = get_service_commands(load_service_module(svc))
    cmd = sys.argv[2] if len(sys.argv) > 2 else 'default'

    if cmd not in svc_commands.keys():
        cli.print_unknown_service_command(svc, cmd)
        sys.exit(1)

    svc_commands[cmd]()


def show_help(service_name):
    if service_name is None:
        print('Help what?')

    elif service_name in ['help', 'aws', 'jack', 'koda', 'me']:
        print('OOH LONG JOHNSON')

    else:
        if service_name not in deploy_def['services']:
            cli.print_unknown_service_name(service_name)
            sys.exit(1)

        svc_module = load_service_module(service_name)
        print('%s%s%s\n' % (cli.bcolors.BOLD, svc_module.__doc__ or 'Documentation is for losers', cli.bcolors.ENDC),
              file=sys.stderr)

        print('%sCommands:%s\n' % (cli.bcolors.HEADER, cli.bcolors.ENDC),
              file=sys.stderr)
        for cmd_name, func in get_service_commands(svc_module).items():
            print('- %s%s%s' % (cli.bcolors.OKGREEN, cmd_name, cli.bcolors.ENDC),
                  file=sys.stderr)
            if func.__doc__ is not None:
                print(func.__doc__, file=sys.stderr)
            print(file=sys.stderr)
