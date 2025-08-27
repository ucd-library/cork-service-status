import { html, css } from 'lit';
import baseStyles from "@ucd-lib/theme-sass/1_base_html/_index.css.js";
import baseClassStyles from '@ucd-lib/theme-sass/2_base_class/_index.css.js';
import objectsStyles from '@ucd-lib/theme-sass/3_objects/_index.css.js';
import componentStyles from "@ucd-lib/theme-sass/4_component/_index.css.js";
import layoutStyles from '@ucd-lib/theme-sass/5_layout/_index.css.js';
import utilityStyles from '@ucd-lib/theme-sass/6_utility/_index.css.js';

import '@ucd-lib/theme-elements/brand/ucd-theme-slim-select/ucd-theme-slim-select.js';

export function styles() {
  const elementStyles = css`
    .custom-collapse {
    --collapse-background-color: pink;
    --collapse-border-color: #FFBF00;
    }
    .query-container {
      margin: .75em;
      background-color: #dbeaf7;
      padding: 1em;
    }
    h2 {
      text-align:center;   
    }
    .result-container {
      margin: .75em;
      background-color: white;
    }
    .name {
      margin:0.012em; 
      color:#022851;
    }
    .field-container {
      margin-top:1em;
    }

    hr {
      border-top: 2px solid #b0d0ed;
      margin: .5em;
    }

    ucd-theme-slim-select {
      font-size:14px;
    }
    .ss-main {
      min-height: 2.25rem;
    }

  `;

  return [
    baseStyles,
    componentStyles,
    baseClassStyles,
    objectsStyles,
    layoutStyles,
    utilityStyles,
    elementStyles
  ];
}

/**
 * @description main render function
 * @returns {TemplateResult}
 */
export function render() {
return html`
  <div class="l-3col l-3col--25-50-25">
    <div class="l-second panel o-box">
      ${this.renderQuery()}
      ${this.renderResult()}
    </div>
  </div>
`;}

/**
 * @description render query
 * @returns {TemplateResult}
 */
export function renderQuery() {
  return html`
    <div class="query-container">
      <h2 class="name">Query Service</h2>

      <div ?hidden=${!this.useUrlQuery} class="field-container">
        <label for="serviceurl">Service URL:</label>
        <input type="url" placeholder="Enter service URL" .value="${this.url}" @input=${this._onUrlInput}>
      </div>

      <div ?hidden=${!this.showControls}>
          
          <label for="tags">Tags:</label>
          <ucd-theme-slim-select @change=${e => this._onTagChange(e.detail, 'tags')}>
            <select multiple>
                ${this.tagsList.map(tag => html`
                  <option value="${tag}" ?selected=${this.opts.tags?.includes(tag)}>${tag}</option>
                `)}
            </select>
          </ucd-theme-slim-select>

          <div class="field-container">
            <label for="search">Search</label>
            <input type="search" placeholder="Enter Search Term" .value="${this.search}" @input=${this._onSearchInput}>
          </div>

          <div class="field-container">
            <label for="selectpicker">Status</label>
            <select @input=${this._onStatusInput} id="selectpicker">
              ${this.statusList.map(stat => {
                const statValue = stat.name.toLowerCase();
                return html`
                  <option
                    value="${statValue}"
                    ?selected=${this.opts.status === statValue}
                  >
                    ${stat.name}
                  </option>
                `;
              })}
            </select>
          </div>


          <div class="checkbox">
              <ul class="list--reset">
              <li><input id="styled-checkbox-dev" name="checkbox" type="checkbox"  .checked=${this.is_dev} @change=${this._onDevToggle}><label for="styled-checkbox-dev"><b>Development</b></label></li>
              </ul>
          </div>
      </div>
  
      <br />
    </div>

    

  `
}

/**
 * @description render result
 * @returns {TemplateResult}
 */
export function renderResult() {
  return html`
    <div ?hidden="${!this.showResults}" class="result-container">
      ${this.data.map(d => html`
        <service-card .service=${d}></service-card>
      `)}      
    </div>
  `
}
