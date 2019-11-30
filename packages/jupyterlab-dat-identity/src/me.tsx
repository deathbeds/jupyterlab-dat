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
        <header>
          <div>{m.icons.iconReact({ name: 'dat-happy-dat' })}</div>
          <input {...nameProps} />
        </header>
        <section>
          <label>
            <span>Bio</span>
            <textarea className="jp-mod-styled"></textarea>
          </label>
          {renderDatURL({
            url: m.publishUrl,
            props: {
              readOnly: true
            }
          })}
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
        <footer className="jp-RenderedMarkdownCommon">
          <blockquote>
            Your identity is how others see you. Publishing your identity makes
            you less anonymous, but allows you to share more with your peers.
          </blockquote>
        </footer>
      </div>
    );
  }
}
