import sys

from ..cli import bcolors, color_print, print_missing_service_command_accounts
from ..config import get_accounts


def requires_account(*required_accounts):
    def wrapper(f):
        def inner():
            accounts, _ = get_accounts()
            missing = [a for a in required_accounts if a not in accounts.keys()]

            if len(missing) > 0:
                print_missing_service_command_accounts(missing)
                sys.exit(0)

            f(accounts)

        inner.__name__ = f.__name__
        inner.__doc__ = f.__doc__
        return inner

    return wrapper


def _util_print(target, detail):
    color_print(bcolors.OKGREEN, '  %s%s: %s' % (target, bcolors.ENDC, detail))


def _util_handle_error(e):
    color_print(bcolors.FAIL, e.response['Error']['Message'])
    sys.exit(1)


from .iam import IAM  # noqa
from .ecr import ECR  # noqa
