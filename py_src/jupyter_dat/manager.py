from pathlib import Path

from tornado.ioloop import IOLoop
from traitlets.config import LoggingConfigurable

from watchgod import awatch, DefaultWatcher

import ujson as json


class NotebookWatcher(DefaultWatcher):
    ignored_dirs = DefaultWatcher.ignored_dirs | {"envs", ".ipynb_checkpoints", "lib", "_lab"}

WATCHER = dict(
    watcher_cls=NotebookWatcher
)

class WebSocketContentsManager(LoggingConfigurable):
    @property
    def cm_path(self):
        return Path(self.parent.contents_manager.root_dir)

    def initialize(self):
        self.path_handlers = {}
        self.watched = {}

    def register(self, handler):
        requested = self.cm_path / handler.path
        self.path_handlers.setdefault(requested, []).append(handler)

        if requested.is_dir():
            watch_dir = requested
        else:
            watch_dir = requested.parent

        already_watched = False

        for watched in self.watched:
            try:
                watch_dir.relative_to(watched)
                already_watched = True
                break
            except:
                pass

        if not already_watched:
            self.log.info("going to watch %s", watch_dir)
            IOLoop.current().add_callback(self.watch, watch_dir)

    def unregister(self, handler):
        self.path_handlers.setdefault(self.cm_path / handler.path, []).remove(handler)

    async def broadcast(self, handler, message):
        self.log.info("going to broadcast %s from %s", message, handler)
        for other_handler in self.path_handlers[self.cm_path / handler.path]:
            if other_handler == handler:
                continue
            await other_handler.write_message(message)

    async def watch(self, path):
        self.watched[path] = True

        self.log.info("watching %s", path)

        async for changes in awatch(path):
            self.log.info("%s changed:\n%s", path, changes)
            for change_type, change_path in changes:
                for path, handlers in self.path_handlers.items():
                    if Path(change_path) == path:
                        for handler in handlers:
                            await handler.write_message({
                                "content": json.loads(path.read_text())
                            })

        # self.watched.pop(path)
