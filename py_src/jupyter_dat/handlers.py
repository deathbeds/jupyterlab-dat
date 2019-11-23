""" tornado handler for managing and communicating with language servers
"""
from notebook.base.handlers import IPythonHandler
from notebook.base.zmqhandlers import WebSocketHandler, WebSocketMixin
from notebook.utils import url_path_join as ujoin


class BaseHandler(IPythonHandler):
    manager = None

    def initialize(self, manager):
        self.manager = manager


class ContentsWebSocketHandler(WebSocketMixin, WebSocketHandler, BaseHandler):
    path = None

    def open(self, path):
        self.path = path
        self.manager.register(self)
        self.log.debug("[%s] Opened", path)

    async def on_message(self, message):
        self.log.debug("[%s] Message %s", self.path, message)
        await self.manager.broadcast(self, message)

    def on_close(self):
        self.manager.unregister(self)
        self.log.debug("[%s] Closed", self.path)


def add_handlers(mgr):
    wsc_url = ujoin(mgr.parent.base_url, "api", "wscontents", "(.*)")
    opts = {"manager": mgr}
    mgr.parent.web_app.add_handlers(
        ".*",
        [
            (wsc_url, ContentsWebSocketHandler, opts),
        ],
    )
