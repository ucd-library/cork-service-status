import { html, css } from 'lit';

export function styles() {
  const elementStyles = css`
    app-page-home {
      display: block;
    }
  `;

  return [elementStyles];
}

export function render() {
return html`
  <service-query></service-query>
`;}
