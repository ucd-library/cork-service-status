import { html, css } from 'lit';
import baseStyles from "@ucd-lib/theme-sass/1_base_html/_index.css.js";
import baseClassStyles from '@ucd-lib/theme-sass/2_base_class/_index.css.js';
import objectsStyles from '@ucd-lib/theme-sass/3_objects/_index.css.js';
import componentStyles from "@ucd-lib/theme-sass/4_component/_index.css.js";
import layoutStyles from '@ucd-lib/theme-sass/5_layout/_index.css.js';
import utilityStyles from '@ucd-lib/theme-sass/6_utility/_index.css.js';

export function styles() {
  const elementStyles = css`
    :host {
      display: block;
    }

    .toolbar { 
        margin-bottom: .75rem; 
        margin-left: 1rem;
    }
    .tags {
        margin-top: .25rem;
    }
    .tags__tag {
        display: inline-block;
        background: #dbeaf7;
        color: #022851;
        padding: .6rem .8rem;
        margin-right: .5rem;
        margin-bottom: .5rem;
        text-decoration: none;
    }
    .tags__tag:hover {
        color:#022851;
    }
    .tagsList {
        display: inline-flex;
        align-items: center;
        gap: .75rem;
    }

    .addTag {   
        white-space: nowrap;
        background: #022851;
        margin-top: .85rem;
        display: inline-flex;
        color: #fff;
        height: 2.5rem;
        padding: 0 .8rem;   
        cursor: pointer;
        justify-content: center;
        align-items: center;
        user-select: none;
    }
    .addTag:hover {
        background: #ffbf00;
        color:#022851;
    }
    .table-padding{
        padding:.75em;
    }

    hr {
        border: .05rem solid #ffbf00;
        margin: 1.5rem 0;
    }

    .checkbox { 
        margin-left:0;
    }

    .moveButton {   
        background: none;
        color:#022851; 

        // border: .05rem solid #00b2e3;
        // padding: .28rem .7rem;
        // cursor:grab; 
        // margin-top: 1rem;
        // margin-right: .5rem;
        margin-left: .5rem;
        font-weight:bold; 
        user-select:none; 

    }
    .confirmation-message {
        margin-top: 1rem;
        margin-bottom: 1rem;
    }

    .removeTag {
        opacity: 0;
        background: none;
        border: none;
        color: #022851;
        font-weight: bold;
        visibility: hidden;
        display:none;
        transform: translateX(4px);
        transition: opacity .15s ease, transform .15s ease, visibility 0s linear .15s;
    }

    .tags__tag:hover .removeTag,
    .tags__tag:focus-within .removeTag {
        display:inline;
        opacity: 1;
        visibility: visible;
        transform: translateX(0);
        transition: opacity .15s ease, transform .15s ease, visibility 0s;
    }

    .deleteButton {
        background: #c10230;
        color: white;
        border: none;
        padding: .45rem 1rem;
        cursor: pointer;
        margin-bottom: 1rem;
    }

    @container (max-width: 400px) {
        .tagsList {
            margin-top: 0;
            display: inline-block; /* or inline-flex */
            margin-bottom: .85rem;
        }
        .addTag {   
            margin-top: 0;
            width: 100%;
        }
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

export function renderForm(){
return html`

<div id='status-form'>
    <h2 class="heading--weighted-underline"><span class="heading--weighted--weighted">Edit</span> Service</h2>

    <br />

    <span style="display:flex; align-items:center; gap:1rem;">
    <h4 class="u-space-mb--small">Create Service Information</h4>
    <button style="background:none;border:none;" @click=${() => this.resetInformation()}><h3>&#x27F3;</h3></button>
    </span>
    <fieldset>
    <div class="field-container ${this.validationHandler.errorClass('name')}">
        <label for="name">Name <abbr title="Required">*</abbr></label>
        <input 
            type="name" 
            .value=${this.service?.name ?? ''}  
            placeholder="Service Name"  
            @input=${e => {
                this.service = { ...(this.service ?? {}), name: e.currentTarget.value };
            }}
            required>
        
        <div>${this.validationHandler.renderErrorMessages('name')}</div>
    </div>
    <div class="field-container">
        <label for="title">Title <abbr title="Required">*</abbr></label>
        <input 
            type="title" 
            .value=${this.service?.title ?? ''} 
            placeholder="Service Title" 
            @input=${e => {
                this.service = { ...(this.service ?? {}), title: e.currentTarget.value };
            }}
            required>
    </div>

    <div class="tagsList">
        <div class="field-container">
            <label for="tags">Tags</label>
            <input
            id="tags"
            type="text"
            placeholder="Tags in Service"
            .value=${this._newTag}
            @input=${e => (this._newTag = e.target.value)}
            @keydown=${e => (e.key === 'Enter' ? this.addTag() : null)}
            />
        </div>
        <div class="addTag" @click=${() => this.addTag()}>Add Tags</div>
    </div>

    <div ?hidden=${!(this.service?.tags?.length)}>
        ${(this.service?.tags ?? []).map(
            tag => html`
                <span class="tags__tag">
                <button class="removeTag" @click=${() => this.removeTag(tag)} aria-label="Remove tag">x</button>
                ${tag}
            </span>`
        )}
    </div>

    <div class="field-container">
        <label for="description">Description</label>
        <textarea
            rows="4"
            placeholder="Description of Service"
            .value=${this.service?.description ?? ''}
            @input=${e => {
                this.service = { ...(this.service ?? {}), description: e.currentTarget.value };
            }}>
        </textarea>
    </div>
    <div class="checkbox">
        <ul class="list--reset">
            <li>
                <input id="styled-checkbox1" 
                        name="checkbox" 
                        type="checkbox" 
                        .checked=${this.service.role} 
                        @change=${e => this._setServicePublic(e.target.checked)}
                        ><label for="styled-checkbox1">Public Service</label></li>
        </ul>
    </div>

    <br />

    </fieldset>

    <span style="display:flex; align-items:center; gap:1rem;">
    <h4 class="u-space-mb--small">Create Service Property Information</h4>
    <button style="background:none;border:none;" @click=${() => this.resetInformation("properties")}><h3>&#x27F3;</h3></button>
    </span>
    <fieldset> 
    <div class="toolbar">
        <button class="btn btn--alt3" @click=${this._addItem}>Add Service Property</button>
    </div>
    ${this.serviceProperties.map((it, idx)  => html`
        <div class="l-container panel" 
            style="border: .05rem solid #ffbf00; padding: 1rem; margin-bottom: 1rem;"
            .key=${it.name}
            draggable="true"
            @dragstart=${() => this._onDragStart(it.name)}
            @dragover=${(e) => this._onDragOver(e)}
            @drop=${() => this._onDrop(it.name)}>
            
            <button class="deleteButton" @click=${() => this._removeItem(it.name)}>Delete</button>


            <div class="checkbox">
                <ul class="list--reset">
                    <li>
                    <input id="${idx}-public-checkbox" 
                            type="checkbox" 
                            .checked=${it.role}
                            @change=${e => this._setServicePropertyPublic(it.name, e.target.checked)}
                    >
                    <label for="${idx}-public-checkbox">Public Service Property</label>
                    </li>
                </ul>
            </div>

            <div class="field-container">
                <label for="prop-${idx}-select">Name</label>
                <select id="prop-${idx}-select"
                        .value=${(it.name ?? '').trim()}
                        @change=${e => this._onNameChange(idx, e.target.value)}>
                    <option value="">(choose)</option>

                    ${this.servicePropertiesOptions.map(opt => {
                        const current = (it.name ?? '').trim();
                        const inUse = opt.present == true && opt.name !== current;
                        return html`
                        <option
                            value=${opt.name}
                            ?selected=${opt.name === current}
                            ?disabled=${inUse}
                        >
                            ${opt.title}${inUse ? ' (in use)' : ''}
                        </option>
                        `;
                    })}


                </select>
            </div>

            <div class="field-container">
                <label for="prop-${idx}-value">Value</label>

                ${this._optionTypeFor(it.name) === 'boolean' ? html`
                <div class="checkbox">
                    <ul class="list--reset">
                        <li>
                            <input id="prop-${idx}-bool" type="checkbox"
                                .checked=${it.values?.[0]?.value === true || it.values?.[0] === true}
                                @change=${e => this._booleanUpdate(idx, e.target.checked)} />
                                <label for="prop-${idx}-bool">In Development</label>
                        </li>
                    </ul>
                </div>
                ` : this._optionTypeFor(it.name) === 'array' ? html`
                        <div class="array-values">
                        ${(Array.isArray(it.values) ? it.values : []).map((val, i) => html`
                            <div class="array-value-row" style="display:flex; align-items:center; gap:.5rem; margin-bottom:.75rem;">
                            <input type="text"
                                    .value=${(val?.value ?? val) ?? ''}
                                    @input=${e => this._onArrayValueInput(idx, i, e.target.value)} />
                            <button type="button"
                                    style="background:#ffbf00;border:none;padding:1.1em 1.25em;color:#022851"
                                    @click=${() => this._removeArrayValue(idx, i)}>−</button>
                            </div>
                        `)}
                        <br />
                        <button class="btn btn--alt3 btn--block" type="button" @click=${() => this._addArrayValue(idx)}>Add item</button>
                        </div>
                ` : html`
                    <textarea id="prop-${idx}-text"
                        rows="5"
                        .value=${this._valueToString(it)}
                        @input=${e => this._onValueInput(it.name, e.target.value)}>
                    </textarea>
                `}
            </div>
        </div>     
    `)}

    </fieldset>

    <input
    type="button"
    class="btn btn--primary btn--block"
    @click=${this.submitForm}
    value="Submit Form" 
    />

    <br />
</div>
`;}

export function renderConfirmation(){
return html`
<div id='status-confirmation'>
    <h2 class="heading--weighted-underline"><span class="heading--weighted--weighted">Review</span> Service</h2>

    <div class="confirmation-message">
        <p>${this.confirmationMessage}</p>
    </div>

    
    <div class="summary-table">
    <h4 class="u-space-mb--small">Service Summary</h4>
    <fieldset>

        <table class="table--admin">
            <br>
            <thead>
                <tr>
                    <th style="width:50%">Service</th>
                </tr>
            </thead>
            <tbody>
                ${this.service.name ? html`<tr><td><b>Service Name</b></td><td class="table-padding">${this.service.name}</td></tr>`: html``}
                ${this.service.title ? html`<tr><td><b>Service Title</b></td><td class="table-padding">${this.service.title}</td></tr>`: html``}
                ${this.service.tags ? html`<tr><td><b>Service Tags</b></td><td class="table-padding">${this.service.tags.map(t => html`${t} <br>`)} </td></tr>`: html``}
                ${this.service.description ? html`<tr><td><b>Service Description</b></td><td class="table-padding">${this.service.description}</td></tr>`: html``}
                ${this.service.public ? html`<tr><td><b>Is Public Service?</b></td><td class="table-padding">${this.service.public}</td></tr>`: html``}
            </tbody>

        </table>

        <table class="table--admin">
            <thead>
                <tr>
                    <th style="width:50%">Service Properties</th>
                </tr>
            </thead>
            <tbody>
                ${this.serviceProperties ? this.serviceProperties.map(sp => {
                    return html`<tr><td><b>${sp.name}</b></td>
                                    <td class="table-padding">${sp.values.length > 1 ? 
                                        html`${sp?.values.map(s => html`${s.value}<br>`)}`
                                        :html`${sp?.values[0]?.value}`}  </td>                               
                                </tr>`;
                }) : ''}
            </tbody>
        </table>
    </div>
    </fieldset>
    <button class="btn btn--primary btn--block" @click=${() => this.navigateToForm()}>Go Back to Form</button>
</div>
`;
}

export function render() {
return html`
    <ucdlib-pages selected=${'status-' + this.page}>
        ${this.renderForm()}
        ${this.renderConfirmation()}
    </ucdlib-pages>
  
`;}
