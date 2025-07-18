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
  ${this.data.map(service => html`
    <pre>${JSON.stringify(service, null, 2)}</pre>
    `)}
`;}
