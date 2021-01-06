def _get_version():
    for ver_src in _VERSION_SOURCES:
        ver = ver_src()
        if ver is not None:
            return ver
    return 'unknown'


def _version_source_git():
    try:
        with open('../.git/HEAD') as head:
            head_data = head.readline()[:-1]

            if head_data.startswith('ref: '):
                branch = head_data[5:].replace(r'refs/heads/', '', 1)
                with open(f'../.git/refs/heads/{branch}') as ref:
                    ref_data = ref.readline()[:-1]
                    return ('' if branch in ['master', 'main'] else f'{branch}-') + ref_data[:7]
            else:
                return head_data[:7]

    except IOError:
        return None


def _version_source_release_file():
    try:
        from importlib.resources import read_text
        return read_text('common', 'RELEASE')[:-1]
    except IOError:
        return None


_VERSION_SOURCES = [_version_source_git, _version_source_release_file]

BACKEND_VERSION = _get_version()
