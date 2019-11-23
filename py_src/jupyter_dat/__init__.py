# flake8: noqa: F401
from ._version import __version__
from .serverextension import load_jupyter_server_extension


def _jupyter_server_extension_paths():
    return [{"module": "jupyter_ws_contents"}]
