# jupyterlab-dat

[![Try Demo on Binder][badge]][binder]

> An experimental approach for publishing/subscribing to streams of notebook
> contents in JupyterLab over the [dat](https://dat.foundation) peer-to-peer network
> This is not [real-time collaboration][rtc].

## Usage

> In a [binder][] or [locally](#try-locally)

### Publish

- Open a notebook
- Click the `⬡⭐` icon in the notebook toolbar
- Click `PUBLISH`
- Copy the `dat://` url, send it to someone else with `jupyterlab-dat` installed
- Change the notebook

### Subscribe

- Open a new Untitled notebook
- Click the `⬡⭐` icon in the notebook toolbar
- Paste a `dat://` url into the text box above `SUBSCRIBE`
- Click `SUBSCRIBE`
- Watch the notebook change

## Features

- two-or-three click publish/subscribe
- optional metadata sharing
- live view of peer count and version
- optional active cell following (enabled by default)
- single-link sharing, e.g.
  ```
  https://mybinder.org/v2/gh/{:repo}/{:branch}?urlpath=lab/tree/dat-mkii/{:dat-hash}
  ```
  - opens an Untitled notebook
  - starts subscribing
  - closes sidebars
  - activates single-document and presentation mode

## How it works

- a publisher
  - joins a _swarm_
  - creates a _archive_
  - stores changes to a notebook as a stream of small files _a la_ [nbexplode][] in a dat
  - send subscribers a 64-character key to subscribers over an out-of-band channel e.g. chat
- a subscriber
  - joins a _swarm_
  - opens a notebook, and subscribes with the provided key
  - replicates the _archive_
  - pushes the small files as received to their notebook
- publishers and subscribers run a [discovery-swarm-web][] process to help find peers in the _swarm_
  - provided via [jupyter-server-proxy][]

## Limitations

- archives are created in-memory, with no persistence, and reference transient
  JupyterLab cell ids
  - if a publisher closes their page, that's it (though existing subscribers
    will keep their notebooks)
- widgets, bokeh, or anything else comm-based, don't work at all

## Try locally

> Needs a `conda` installation, e.g. Miniconda or Anaconda

```bash
(base) conda env update
(base) source activate jupyterlab-dat
(jupyterlab-dat) bash postBuild
(jupyterlab-dat) jupyterlab
```

[binder]: https://mybinder.org/v2/gh/deathbeds/jupyterlab-dat/master?urlpath=lab
[badge]: https://mybinder.org/badge_logo.svg
[nbexplode]: https://github.com/takluyver/nbexplode
[jupyter-server-proxy]: https://github.com/jupyterhub/jupyter-server-proxy
[discovery-swarm-web]: https://github.com/RangerMauve/discovery-swarm-web
[rtc]: https://github.com/jupyterlab/jupyterlab/issues/5382
