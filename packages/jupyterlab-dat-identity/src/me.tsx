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
    this.title.iconClass = CSS.DAT.ICONS.happy;
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

    if (!m) {
      return <div />;
    }

    const nameProps = {
      className: 'jp-mod-styled',
      defaultValue: m.handle,
      placeholder: 'anon',
      onChange: this.onNameChange
    };

    return (
      <div className={`${CSS.ME}-Main`}>
        <section>
          <input {...nameProps} />
          <small>
            <i>Your name for chat and dat authoring</i>
          </small>
        </section>
        <section>
          <span>Bio</span>
          <br />
          <textarea className="jp-mod-styled" rows={5}></textarea>
          <br />
          <small>
            <i>A short text about yourself</i>
          </small>
        </section>
        <section>
          {renderDatURL({
            url: m.publishUrl,
            props: {
              readOnly: true
            }
          })}
          <small>
            <i>Your personal dat url</i>
          </small>
        </section>
        <section>
          {renderBigButton({
            icon: 'dat-create-new-dat',
            icons: this.model.icons,
            label: m.isPublishing ? 'PUBLISHING' : 'PUBLISH',
            className: m.isPublishing ? '' : CSS.DAT.JP.accept,
            props: {
              disabled: m.isPublishing,
              onClick: this.onPublish
            }
          })}
        </section>
      </div>
    );
  }
}
