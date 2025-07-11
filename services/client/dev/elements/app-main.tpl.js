import '@ucd-lib/theme-elements/brand/ucd-theme-primary-nav/ucd-theme-primary-nav.js';
import '@ucd-lib/theme-elements/brand/ucd-theme-header/ucd-theme-header.js';
import '@ucd-lib/theme-elements/ucdlib/ucdlib-branding-bar/ucdlib-branding-bar.js';
import '@ucd-lib/theme-elements/ucdlib/ucdlib-pages/ucdlib-pages.js';

import { html, css } from 'lit';

export function styles() {
  const elementStyles = css`
    :host {
      display: block;
    }
  `;

  return [elementStyles];
}

export function render() {
return html`
  <ucd-theme-header>
    <ucdlib-branding-bar
      site-name="Cork Icon"
      slogan="Demo Application">
    </ucdlib-branding-bar>
    <ucd-theme-primary-nav>
      <a href="/">Services</a>
    </ucd-theme-primary-nav>
  </ucd-theme-header>

  <div class='l-container u-space-mt--large'>
    <ucdlib-pages
      id='app-pages'
      selected=${this.page}
      attr-for-selected='page-id'>
    </ucdlib-pages>

  </div>

`;}
