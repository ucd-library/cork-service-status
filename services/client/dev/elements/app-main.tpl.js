import '@ucd-lib/theme-elements/brand/ucd-theme-primary-nav/ucd-theme-primary-nav.js';
import '@ucd-lib/theme-elements/brand/ucd-theme-header/ucd-theme-header.js';
import '@ucd-lib/theme-elements/ucdlib/ucdlib-branding-bar/ucdlib-branding-bar.js';
import '@ucd-lib/theme-elements/ucdlib/ucdlib-pages/ucdlib-pages.js';

import { html, css } from 'lit';

export function styles() {
  const elementStyles = css`
    :host {
      display: none;
    }
  `;

  return [elementStyles];
}

export function render() {
return html`
  ${renderHeader.call(this)}
  <app-toast></app-toast>
  <div class='l-container u-space-mt--large'>
    ${this.page ? html`
      <ucdlib-pages
        id='app-pages'
        selected=${this.page}
        attr-for-selected='page-id'>
      <app-page-home page-id="home"></app-page-home>
      </ucdlib-pages>
      ` : html``}
  </div>

`;
}

function renderHeader(){
  return html`
    <ucd-theme-header>
      <ucdlib-branding-bar
        site-name="UC Davis Library"
        slogan="Service and Application Status">
      </ucdlib-branding-bar>
      <ucd-theme-primary-nav>
      </ucd-theme-primary-nav>
    </ucd-theme-header>
  `;
}
