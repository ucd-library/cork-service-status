import { LitElement } from 'lit';
import {render, styles} from "./app-main.tpl.js";

import {Mixin, MainDomElement} from '@ucd-lib/theme-elements/utils/mixins/index.js';
import { LitCorkUtils } from '@ucd-lib/cork-app-utils';

export default class AppMain extends Mixin(LitElement)
  .with(MainDomElement, LitCorkUtils) {

  static get properties() {
    return {
      page: {type: String},
      _firstAppStateUpdate : { state: true }
    }
  }

  static get styles() {
    return styles();
  }

  constructor() {
    super();
    this.render = render.bind(this);
    this.page = '';
    this._firstAppStateUpdate = false;

    this._injectModel('AppStateModel');
  }

  async _onAppStateUpdate(e) {
    console.log('AppStateModel updated', e);
    if ( !this._firstAppStateUpdate ) {
      this._firstAppStateUpdate = true;
      this.hideFullSiteLoader();
    }
    this.closeNav();
    const { page, location } = e;
    this.page = page;

  }

  async hideFullSiteLoader(timeout=300){
    // Hide the full site loader after a timeout
    await new Promise(resolve => setTimeout(resolve, timeout));
    document.querySelector('#site-loader').style.display = 'none';
    this.style.display = 'block';
  }

  /**
   * @description Close the app's primary nav menu
   */
  closeNav(){
    let ele = this.renderRoot.querySelector('ucd-theme-header');
    if ( ele ) {
      ele.close();
    }
    ele = this.renderRoot.querySelector('ucd-theme-quick-links');
    if ( ele ) {
      ele.close();
    }
  }


}

customElements.define('app-main', AppMain);
