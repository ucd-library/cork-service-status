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
      <service-form service-id="432035c0-21ee-4b04-bf82-050537bf7912"></service-form>
    </div>
  </div>
  
`;}
