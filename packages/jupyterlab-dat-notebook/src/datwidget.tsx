import React from 'react';

import { renderInfoTable } from '@deathbeds/jupyterlab-dat/lib/framents/infotable';

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
          {this.renderShield('dat-create-new-dat')}
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
      return renderInfoTable(m.publishInfo);
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
    return (
      <div className={CSS.SHIELD}>
        {this.model.icons.iconReact({ name: icon })}
      </div>
    );
  }

  renderSubscribe(m: DatNotebookModel) {
    const buttonProps = {
      className:
        BTN_CLASS + (m.subscribeUrl && !m.isSubscribed ? ' jp-mod-accept' : ''),
      disabled: !m.subscribeURLisValid || m.isSubscribed,
      onClick: async () => await m.onSubscribe()
    };
    return (
      <section>
        <input
          defaultValue={m.subscribeUrl}
          onChange={e => (m.subscribeUrl = e.currentTarget.value)}
          placeholder={PLACEHOLDER}
          className="jp-mod-styled"
          onFocus={handleFocus}
        />
        <button {...buttonProps}>
          <label>{m.isSubscribed ? 'SUBSCRIBED' : 'SUBSCRIBE'}</label>
          {this.renderShield('dat-hexagon-resume')}
        </button>
        {this.renderSubscribeInfo(m)}
        {this.renderSubscribeForm(m)}
      </section>
    );
  }

  renderSubscribeInfo(m: DatNotebookModel) {
    if (m.isSubscribed && m.subscribeInfo) {
      return renderInfoTable(m.subscribeInfo);
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
        <label>
          <i>Render Markdown</i>
          <input
            type="checkbox"
            defaultChecked={m.autoRender}
            className="jp-mod-styled"
            onChange={() => (m.autoRender = !m.autoRender)}
          />
        </label>
        <label>
          <i>Trust Content</i>
          <input
            type="checkbox"
            defaultChecked={m.autoTrust}
            className="jp-mod-styled"
            onChange={() => (m.autoTrust = !m.autoTrust)}
          />
        </label>
      </details>
    );
  }
}
