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

  <div class="l-3col l-3col--25-50-25">
    <div class="l-second">
      <service-form service-id="901eaf41-97b1-46a0-b790-b06e59094233"></service-form>
    </div>
  </div>
  
`;}
