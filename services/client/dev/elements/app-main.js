import { LitElement } from 'lit';
import {render, styles} from "./app-main.tpl.js";

import {Mixin, MainDomElement} from '@ucd-lib/theme-elements/utils/mixins/index.js';
import { LitCorkUtils } from '@ucd-lib/cork-app-utils';

export default class AppMain extends Mixin(LitElement)
  .with(MainDomElement, LitCorkUtils) {

  static get properties() {
    return {
      page: {type: String},
    }
  }

  static get styles() {
    return styles();
  }

  constructor() {
    super();
    this.render = render.bind(this);
    this.page = '';
  }

}

customElements.define('app-main', AppMain);
