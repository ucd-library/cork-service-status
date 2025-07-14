import { LitElement } from 'lit';
import {render, styles} from "./service-query.tpl.js";
import { LitCorkUtils, Mixin } from '@ucd-lib/cork-app-utils';
import AppComponentController from '../../../controllers/AppComponentController.js';

export default class ServiceQuery extends Mixin(LitElement)
  .with(LitCorkUtils) {

  static get properties() {
    return {

    }
  }

  static get styles() {
    return styles();
  }

  constructor() {
    super();
    this.render = render.bind(this);
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

  getData(){
    if ( !this.appComponentController.isOnActivePage() ) return;
    this.ServiceModel.query();
  }

}

customElements.define('service-query', ServiceQuery);
