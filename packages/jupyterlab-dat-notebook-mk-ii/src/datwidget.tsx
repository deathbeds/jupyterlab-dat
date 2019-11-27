import React from 'react';

import { dat } from '@deathbeds/dat-sdk-webpack';

import { VDomRenderer } from '@jupyterlab/apputils';

import { CSS } from '.';

import { DatNotebookModel } from './model';

const PLACEHOLDER = 'dat://';
const BTN_CLASS = `jp-mod-styled ${CSS.BTN.big}`;

const handleFocus = (event: React.FocusEvent<HTMLInputElement>) =>
  event.target.select();

export class DatWidget extends VDomRenderer<DatNotebookModel> {
  constructor(options: DatNotebookModel.IOptions) {
    super();
    this.model = new DatNotebookModel(options);
    this.title.iconClass = CSS.ICONS.star;
    this.addClass(CSS.WIDGET);
    this.addClass('jp-dat-mkii');
  }

  dispose() {
    if (this.isDisposed) {
      return;
    }
    this.model.dispose();
    this.model = null;
    super.dispose();
  }

  protected render() {
    const m = this.model;

    const { tabTitle } = m;

    this.title.label = tabTitle;

    const props = {
      className: `${CSS.MAIN} jp-RenderedHTMLCommon`
    };

    return (
      <div {...props}>
        {this.renderPublish(m)}
        {this.renderSubscribe(m)}
        <h1>mkii</h1>
      </div>
    );
  }

  renderPublish(m: DatNotebookModel) {
    const buttonProps = {
      disabled: !!m.publishUrl,
      onClick: async () => await m.onPublish(),
      className: BTN_CLASS + (!m.isPublishing ? ' jp-mod-accept' : '')
    };
    return (
      <section>
        <input
          readOnly={true}
          defaultValue={m.publishUrl}
          className="jp-mod-styled"
          placeholder={PLACEHOLDER}
          onFocus={handleFocus}
        />
        <button {...buttonProps}>
          <label>{m.isPublishing ? 'PUBLISHING' : 'PUBLISH'}</label>
          {this.renderShield('create')}
        </button>
        {this.renderPublishInfo(m)}
        {this.renderInfoForm(m)}
      </section>
    );
  }

  renderInfoForm(m: DatNotebookModel) {
    return (
      <details>
        <summary>Manifest</summary>
        <label>
          <i>Title</i>
          <input
            defaultValue={m.title}
            className="jp-mod-styled"
            onChange={evt => (m.title = evt.currentTarget.value)}
          />
        </label>
        <label>
          <i>Author</i>
          <input
            defaultValue={m.author}
            className="jp-mod-styled"
            onChange={evt => (m.author = evt.currentTarget.value)}
          />
        </label>
        <label>
          <i>Description</i>
          <textarea
            defaultValue={m.description}
            className="jp-mod-styled"
            onChange={evt => (m.description = evt.currentTarget.value)}
            rows={5}
          />
        </label>
      </details>
    );
  }

  renderPublishInfo(m: DatNotebookModel) {
    if (m.isPublishing && m.publishInfo) {
      return this.renderInfo(m.publishInfo);
    } else {
      return (
        <blockquote>
          <i>
            Publish the full contents of this notebook with the DAT peer-to-peer
            network as JSON fragments. Send the link to anybody with
            <code>jupyterlab-dat</code>.
          </i>
        </blockquote>
      );
    }
  }

  renderShield(icon: string) {
    const props = {
      className: `${CSS.ICONS[icon]} ${CSS.SHIELD}`
    };
    return <div {...props}></div>;
  }

  renderSubscribe(m: DatNotebookModel) {
    const buttonProps = {
      className:
        BTN_CLASS + (m.loadUrl && !m.isSubscribed ? ' jp-mod-accept' : ''),
      disabled: !m.loadUrl || m.isSubscribed,
      onClick: async () => await m.onSubscribe()
    };
    return (
      <section>
        <input
          defaultValue={m.loadUrl}
          onChange={e => (m.loadUrl = e.currentTarget.value)}
          placeholder={PLACEHOLDER}
          className="jp-mod-styled"
          onFocus={handleFocus}
        />
        <button {...buttonProps}>
          <label>{m.isSubscribed ? 'SUBSCRIBED' : 'SUBSCRIBE'}</label>
          {this.renderShield('resume')}
        </button>
        {this.renderSubscribeInfo(m)}
        {this.renderSubscribeForm(m)}
      </section>
    );
  }

  renderSubscribeInfo(m: DatNotebookModel) {
    if (m.isSubscribed && m.subscribeInfo) {
      return this.renderInfo(m.subscribeInfo);
    } else {
      return (
        <blockquote>
          <i>
            Replace the contents of this notebook with the notebook published at
            the above dat URL, and watch for changes.
          </i>
        </blockquote>
      );
    }
  }

  renderSubscribeForm(m: DatNotebookModel) {
    return (
      <details>
        <label>
          <i>Follow</i>
          <input
            type="checkbox"
            defaultChecked={m.follow}
            className="jp-mod-styled"
            onChange={() => (m.follow = !m.follow)}
          />
        </label>
      </details>
    );
  }

  renderInfo(info: dat.IDatArchive.IArchiveInfo) {
    let author = '';

    if (info.author) {
      if (typeof info.author === 'string') {
        author = info.author;
      } else if (info.author.name) {
        author = info.author.name;
      }
    }

    return (
      <table>
        <thead>
          <tr>
            <th>Version</th>
            <th>Peers</th>
            <th>Title</th>
            <th>Description</th>
            <th>Author</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{info.version || 0}</td>
            <td>{info.peers || 0}</td>
            <td>{info.title || ''}</td>
            <td>{info.description || ''}</td>
            <td>{author}</td>
          </tr>
        </tbody>
      </table>
    );
  }
}
