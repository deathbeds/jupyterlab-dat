import shutil


def discovery_swarm_web():
    """ Starts discovery-swarm-web so the browser can find it at:

        https://localhost:8888/discovery-swarm-web/

        - trailing slash is important (won't follow redirects)
        - should _just work_ on a Hub
        - requires a modern node/npm/npx (bleah)
    """
    npx = shutil.which("npx")

    return dict(
        command=[npx, "--port", "{port}"]
    )
