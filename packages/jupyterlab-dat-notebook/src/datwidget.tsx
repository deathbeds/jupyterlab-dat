import React from 'react';

import {
  renderInfoTable,
  renderBigButton,
  renderDatURL
} from '@deathbeds/jupyterlab-dat/lib/fragments';

import { VDomRenderer } from '@jupyterlab/apputils';

import { CSS } from '.';

import { DatNotebookModel } from './model';

export class DatWidget extends VDomRenderer<DatNotebookModel> {
  constructor(options: DatNotebookModel.IOptions) {
    super();
    this.model = new DatNotebookModel(options);
    this.title.icon = CSS.ICON_NAMES.notebookPublish;
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
      className: `${CSS.MAIN} ${CSS.JP.md} ${CSS.PANEL}`
    };

    return (
      <div {...props}>
        {this.renderPublish(m)}
        {this.renderSubscribe(m)}
      </div>
    );
  }

  onPublish = async () => {
    this.model.onPublish();
  };

  renderPublish(m: DatNotebookModel) {
    return (
      <section>
        {renderDatURL({
          url: m.publishUrl,
          props: {
            readOnly: true
          }
        })}
        {renderBigButton({
          icon: CSS.ICON_NAMES.notebookPublish,
          label: m.isPublishing ? 'PUBLISHING' : 'PUBLISH',
          icons: m.icons,
          className: m.isPublishing ? '' : CSS.JP.accept,
          props: {
            onClick: this.onPublish,
            disabled: !!m.publishUrl
          }
        })}
        {this.renderPublishInfo(m)}
        {this.renderInfoForm(m)}
      </section>
    );
  }

  renderInfoForm(m: DatNotebookModel) {
    const myDat = m.useMyDat
      ? m.icons.iconReact({ name: CSS.ICON_NAMES.happy, tag: 'span' })
      : null;

    return (
      <details>
        <summary>Manifest</summary>
        <label>
          <i>Title</i>
          <input
            type="text"
            defaultValue={m.title}
            className={CSS.JP.styled}
            onChange={evt => (m.title = evt.currentTarget.value)}
          />
        </label>
        <label>
          <i>Author</i>
          <input
            type="text"
            defaultValue={m.author}
            className={CSS.JP.styled}
            onChange={evt => (m.author = evt.currentTarget.value)}
          />
          <i>{myDat} link to my dat </i>
          <input
            defaultChecked={m.useMyDat}
            onChange={evt => (m.useMyDat = !m.useMyDat)}
            type="checkbox"
          />
        </label>
        <label>
          <i>Description</i>
          <textarea
            defaultValue={m.description}
            className={CSS.JP.styled}
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

  onSubscribeUrlChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    this.model.subscribeUrl = evt.currentTarget.value;
  };

  onSubscribe = async () => {
    await this.model.onSubscribe();
  };

  renderSubscribe(m: DatNotebookModel) {
    return (
      <section>
        {renderDatURL({
          url: m.subscribeUrl,
          props: {
            onChange: this.onSubscribeUrlChange
          }
        })}
        {renderBigButton({
          label: m.isSubscribed ? 'SUBSCRIBED' : 'SUBSCRIBE',
          icon: CSS.ICON_NAMES.notebookSubscribe,
          icons: m.icons,
          className: m.canSubscribe ? CSS.JP.accept : '',
          props: {
            disabled: !m.canSubscribe,
            onClick: this.onSubscribe
          }
        })}
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
            className={CSS.JP.styled}
            onChange={() => (m.follow = !m.follow)}
          />
        </label>
        <label>
          <i>Render Markdown</i>
          <input
            type="checkbox"
            defaultChecked={m.autoRender}
            className={CSS.JP.styled}
            onChange={() => (m.autoRender = !m.autoRender)}
          />
        </label>
        <label>
          <i>Trust Content</i>
          <input
            type="checkbox"
            defaultChecked={m.autoTrust}
            className={CSS.JP.styled}
            onChange={() => (m.autoTrust = !m.autoTrust)}
          />
        </label>
      </details>
    );
  }
}
