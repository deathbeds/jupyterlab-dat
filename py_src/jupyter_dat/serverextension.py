from .handlers import add_handlers
from .manager import WebSocketContentsManager


def load_jupyter_server_extension(nbapp):
    mgr = WebSocketContentsManager(parent=nbapp)
    mgr.initialize()
    add_handlers(mgr)
