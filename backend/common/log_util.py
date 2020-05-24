import logging


LOG_FORMAT = "%(asctime)s [%(levelname)s] %(name)s - %(message)s"


def configure_logging(module, level):
    root = logging.getLogger()
    h = logging.StreamHandler()
    h.setFormatter(logging.Formatter(LOG_FORMAT))
    root.addHandler(h)

    if level is not None:
        logging.getLogger('common').setLevel(level)
        logging.getLogger(module).setLevel(level)
