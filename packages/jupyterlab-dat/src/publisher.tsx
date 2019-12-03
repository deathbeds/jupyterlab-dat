import React from 'react';

import {
  renderInfoTable,
  renderBigButton,
  renderDatURL
} from '@deathbeds/jupyterlab-dat/lib/fragments';

import { VDomRenderer, VDomModel } from '@jupyterlab/apputils';

import { CSS } from '.';
import { Widget } from '@phosphor/widgets';
import { dat } from '@deathbeds/dat-sdk-webpack';
import { IIconRegistry } from '@jupyterlab/ui-components';
import { IDatManager } from './tokens';

export class Publisher extends VDomRenderer<Publisher.Model<Widget>> {
  constructor () {
    super();
    this.addClass(CSS.PANEL);
    this.addClass(CSS.PUBLISHER);
    this.title.icon = CSS.ICON_NAMES.create;
    this.title.label = "publish";
  }

  protected render() {
    const m = this.model;

    return (
      <div className={`${CSS.PUBLISHER}-Main`}>
        <section>
          {this.renderPublishInfo()}
          {this.renderInfoForm()}
        </section>
        <footer>
          {renderDatURL({
            url: m.url,
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
              disabled: !m.canPublish
            }
          })}
        </footer>
      </div>
    );
  }

  onPublish = async () => await this.model.publish().catch(console.warn);

  renderPublishInfo() {
    const m = this.model;
    if (m.isPublishing && m.info) {
      return renderInfoTable(m.info);
    } else {
      return (
        <blockquote>
          <i>
            Publish the full contents of this {m.contentLabel} with the DAT
            peer-to-peer network as JSON fragments. Send the link to anybody
            with
            <code>jupyterlab-dat</code>.
          </i>
        </blockquote>
      );
    }
  }

  renderInfoForm() {
    const m = this.model;

    return (
      <details>
        <summary>Manifest</summary>
        <label>
          <i>Title</i>
          <input
            defaultValue={m.title}
            className={CSS.JP.styled}
            onChange={evt => (m.title = evt.currentTarget.value)}
          />
        </label>
        <label>
          <i>Author</i>
          <input
            defaultValue={m.author}
            className={CSS.JP.styled}
            onChange={evt => (m.author = evt.currentTarget.value)}
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
}

export namespace Publisher {
  export class Model<T extends Widget> extends VDomModel {
    protected _icons: IIconRegistry;
    protected _datManager: IDatManager;
    protected _datTypes: IDatManager.IDatType[];
    protected _contentLabel: string;
    protected _icon: string;

    protected _status: string;

    protected _title: string;
    protected _description: string;
    protected _author: string;
    protected _archive: dat.IDatArchive;
    protected _url: string;
    protected _info: dat.IDatArchive.IArchiveInfo;

    // readonly-ish
    get contentLabel() {
      return this._contentLabel;
    }

    get url() {
      return this._url;
    }

    get icon() {
      return this._icon;
    }

    get isPublishing() {
      return !!this._url;
    }

    get info() {
      return this._info;
    }

    get icons() {
      return this._icons;
    }

    get canPublish() {
      return !this._url;
    }
    get datTypes() {
      return this._datTypes;
    }

    // read/write
    get author() {
      return this._author;
    }
    set author(author) {
      this._author = author;
      this.stateChanged.emit(void 0);
      if (this._archive) {
        this._archive.configure({ author }).catch(console.warn);
      }
    }

    get description() {
      return this._description;
    }
    set description(description) {
      this._description = description;
      this.stateChanged.emit(void 0);
      if (this._archive) {
        this._archive.configure({ description }).catch(console.warn);
      }
    }

    get title() {
      return this._title;
    }
    set title(title) {
      this._title = title;
      this.stateChanged.emit(void 0);
      if (this._archive) {
        this._archive.configure({ title }).catch(console.warn);
      }
    }

    get status() {
      return this._status;
    }
    set status(status) {
      this._status = status;
      this.stateChanged.emit(void 0);
    }

    /** the rest to be implemented by subclasses */
    async publish() {
      this.status = 'sharing';
      const { title, description, author } = this;

      this._archive = await this._datManager.create({
        type: this._datTypes.map(type => type.name),
        title,
        description,
        author
      });
    }
  }
}
