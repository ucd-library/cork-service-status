import { LitElement } from 'lit';
import {render, styles} from "./service-query.tpl.js";
import { LitCorkUtils, Mixin } from '@ucd-lib/cork-app-utils';
import AppComponentController from '../../../controllers/AppComponentController.js';

export default class ServiceQuery extends Mixin(LitElement)
  .with(LitCorkUtils) {

  static get properties() {
    return {
      data: {type: Array},
    }
  }

  static get styles() {
    return styles();
  }

  constructor() {
    super();
    this.render = render.bind(this);
    this.data = [];
    this.appComponentController = new AppComponentController(this);

    this._injectModel('AppStateModel', 'ServiceModel');
  }

  connectedCallback() {
    super.connectedCallback();
    this.getData();
  }

  _onAppStateUpdate() {
    this.getData();
  }

  async getData(){
    if ( !this.appComponentController.isOnActivePage() ) return;
    const r = await this.ServiceModel.query();
    if ( r.state !== 'loaded' ) return;
    this.data = r.payload;
  }

}

customElements.define('service-query', ServiceQuery);
