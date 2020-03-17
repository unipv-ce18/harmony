import logging


def configure_logging(module, level):
    root = logging.getLogger()
    h = logging.StreamHandler()
    h.setFormatter(logging.Formatter("%(asctime)s [%(levelname)s] %(name)s - %(message)s"))
    root.addHandler(h)

    if level is not None:
        logging.getLogger('common').setLevel(level)
        logging.getLogger(module).setLevel(level)
