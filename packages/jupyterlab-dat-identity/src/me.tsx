import React from 'react';

import { Widget } from '@phosphor/widgets';

import { VDomRenderer } from '@jupyterlab/apputils';

import { DatIdentityModel } from './model';

import {
  renderBigButton,
  renderDatURL
} from '@deathbeds/jupyterlab-dat/lib/fragments';

import { CSS } from '.';

export class DatMe extends VDomRenderer<DatIdentityModel> {
  constructor(options?: Widget.IOptions) {
    super(options);
    this.title.caption = 'my dat';
    this.title.icon = CSS.DAT.ICON_NAMES.happy;
    this.addClass(CSS.ME);
  }

  onNameChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    this.model.handle = evt.currentTarget.value;
  };
  onPublish = async () => {
    await this.model.publish();
  };

  protected render() {
    const m = this.model;
    this.title.dataset = {
      'dat-status': m.isPublishing
        ? CSS.DAT.STATUS.publishing
        : CSS.DAT.STATUS.offline
    };

    if (!m) {
      return <div />;
    }

    const nameProps = {
      className: CSS.DAT.JP.styled,
      defaultValue: m.handle,
      placeholder: 'anon',
      onChange: this.onNameChange,
      type: 'text'
    };

    return (
      <div className={`${CSS.ME}-Main ${CSS.DAT.PANEL}`}>
        <section>
          <p>
            <label>Name</label>
            <input {...nameProps} />
            <small>
              <i>Your name for dat publishing and chat</i>
            </small>
          </p>
          <p>
            <label>Bio</label>
            <textarea className={CSS.DAT.JP.styled} rows={5}></textarea>
            <small>
              <i>A short text about yourself</i>
            </small>
          </p>
        </section>
        <footer>
          <p>
            <label>My Dat</label>
            {renderDatURL({
              url: m.publishUrl,
              props: {
                readOnly: true
              }
            })}
            <small>
              <i>Your personal dat link</i>
            </small>
          </p>
          {renderBigButton({
            icon: CSS.DAT.ICON_NAMES.happy,
            icons: this.model.icons,
            label: m.isPublishing ? 'PUBLISHING' : 'PUBLISH',
            className: m.canPublish ? CSS.DAT.JP.accept : '',
            props: {
              disabled: !m.canPublish,
              onClick: this.onPublish
            }
          })}
        </footer>
      </div>
    );
  }
}
