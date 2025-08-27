import { html, css } from 'lit';

export function styles() {
  const elementStyles = css`
    :host {
      display: block;
    }
    .res-container {
      padding: 1em;
      background-color: white;
    }
    :hover.res-container {
      background-color: #dbeaf7;
    }
    .tag {
      background-color:#13639e;
      color:white;
      border-radius: .5em;
      padding: .4em 2.15em;
      font-size: .8em;
      margin: 0 .75em 0 0;
      flex: 0 0 auto; 
    }

    .tag-container {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25em;        
    }
      
    .name {
      margin:0.012em; 
      color:#022851;
    }
    .title {
      margin-top:0.015em;  
      margin-bottom:0.5em;  
      color:#022851;
    }
  
    .devTag {
      color: #c10230;
      margin-top:0.01em;  
      margin-bottom:0.75em;  
    }

    @container (max-width: 400px) {
      .name {
        text-align:center;
        white-space: nowrap;  
        overflow: hidden; 
        text-overflow: ellipsis;
      }
      .title {
        text-align:center;
        white-space: nowrap;  
        overflow: hidden; 
        text-overflow: ellipsis;
      }
      .devTag {
        text-align:center;
        white-space: nowrap;  
        overflow: hidden; 
        text-overflow: ellipsis;
      }
      .tag {
        margin: 0.2em auto;   
        max-width: 4.5em;
      }

    }  
      `;

  return [elementStyles];
}

export function render() { 
return html`
  <div class="res-container" @click=${this.clickCard}>
    <h2 class="name">${this.service.name ? this.toTitleCase(this.service.name) : "Name Not Found"}</h2>
    <h4 class="title">${this.service.title ? this.service.title : "Title Not Found"}</h4>
    <h5 ?hidden=${!this.service.is_dev} class="devTag">Currently in Development</h5>
    <div class="tag-container">
    ${this.service.tags?.length
      ? this.service.tags.map(tag => html`<div class="tag">${tag}</div>`)
      : null}
    </div>
  </div>
`;}