import { LitElement } from 'lit';
import {styles} from "./service-query.tpl.js";
import * as Templates from "./service-query.tpl.js"
import { LitCorkUtils, Mixin } from '@ucd-lib/cork-app-utils';
import AppComponentController from '../../../controllers/AppComponentController.js';

/**
 * @description querying and displaying services that filters like tags, status, 
 * search, and dev status.
 */
export default class ServiceQuery extends Mixin(LitElement)
  .with(LitCorkUtils) {

  static get properties() {
    return {
      data: {type: Array, attribute: 'data'},
      is_dev: {type: Boolean, attribute: 'dev'},
      tags: {type: Object, attribute: 'tags'},
      search: {type: String, attribute: 'search'},
      status: {type: String, attribute: 'status'},
      showControls: {type: Boolean, attribute: 'show-controls'},
      showResults: { type: Boolean },
      useUrlQuery: {type: Boolean, attribute: 'use-url-query'}
    }
  }

  static get styles() {
    return styles();
  }

  constructor() {
    super();
    this.render = Templates.render.bind(this);
    this.renderQuery = Templates.renderQuery.bind(this);
    this.renderResult = Templates.renderResult.bind(this);
    
    this.data = [];
    this.url = ``;
    this.isUserEditingUrl = false;
    this.showControls = false;
    this.showResults = false;
    this.useUrlQuery = false;
    this.opts = {};
    this.tags = [];
    this.is_dev = null;
    this.statusList = [];
    this.tagsList = [];
    this.search = '';
    this.status = ''
    this.appComponentController = new AppComponentController(this);
    this._injectModel('AppStateModel', 'ServiceModel');
  }

  /**
   * @description Initializes status list and triggers data loading.
   * @return {Promise<void>}
  */
  async connectedCallback() {
    super.connectedCallback();
    this.statusList = [
      {
        name: "--",
        contentBorderColor: "#f7fafd",
        statusIcon: '\u{1F7E1}\t'
      },
      {
        name: "Up",
        contentBorderColor: "#dce6da00",
        statusIcon: '\u{1F7E2}\t'
      },
      {
        name: "Down",
        contentBorderColor: "#13639e00",
        statusIcon: '\u{1F534}\t'
      }
    ];

    await this.getData();
    this.getTags();
    await this.propertiesCheck();

  }

  /**
   * @description Sets filters and loads data if any are active.
   * @return {Promise<void>}
   */
  async propertiesCheck(){
    this.opts = {};  // Reset cleanly

      if(this.search !== ''){
        this.opts.search = this.search;
      }

      if(this.status !== ''){
        this.opts.status = this.status;
      }
      if(Array.isArray(this.tags) && this.tags.length > 0){
        this.opts.tags = this.tags;       
      }

      if(this.is_dev !== null){
        this.opts.is_dev = this.is_dev;
      }

      if(Object.keys(this.opts).length > 0) {
        await this.getData();
        this.showResults = true;
      }

      this.requestUpdate();
      
  }

  /**
   * @description Updates filters and reloads data.
   * @return {void}
   */
  updateURL(){
    this.getData();
    this.showResults = true;
    this.requestUpdate();
  }

  /**
   * @description Updates tag filter from selection.
   * @param {Array} e - Array of selected tag objects with a `value` property.
   * @param {string} prop - The name of the filter to update (e.g. 'tags').
   * @return {void}
   */
  _onTagChange(e, prop){
    const tagValues = e.map(tag => tag.value);
    this.opts[prop] = tagValues;

    this.updateURL();
  }

  /**
   * @description Updates search filter from input.
   * @param {InputEvent} e - Input event from the search field.
   * @return {void}
   */
  _onSearchInput(e){
    if(e.target.value == ''){
      delete this.opts["search"]
      this.updateURL();
      return;
    }
    this.search = e.target.value.toLowerCase();
    this.opts.search = this.search;
    this.updateURL();
  }

  /**
   * @description Updates status filter from dropdown.
   * @param {InputEvent} e - Input event from the status selector.
   * @return {void}
   */
  _onStatusInput(e){
    if(e.target.value == '--') {
      delete this.opts["status"]; 
      this.updateURL();
      return;
    }

    this.status = e.target.value.toLowerCase();
    this.opts.status = this.status;
    this.updateURL();
  }

  /**
   * @description Updates URL filter and flags manual edit.
   * @param {InputEvent} e - Input event from the URL input.
   * @return {void}
   */
  _onUrlInput(e){
    this.isUserEditingUrl = true;
    this.url = e.target.value.toLowerCase();
    this.opts.url = this.url;
    this.updateURL();
  }

  /**
   * @description Toggles the is_dev filter.
   * @return {void}
   */
  _onDevToggle(){
    this.is_dev = this.is_dev ? false:true;
    this.opts.is_dev = this.is_dev;
    this.updateURL();
  }

  /**
   * @description Reloads data on app state change.
   * @return {void}
   */
  _onAppStateUpdate() {
    this.getData();
    this.getTags();
    this.showResults = true;

  }

  /**
   * @description Builds a unique list of tags from results.
   * @return {void}
   */
  getTags(){
    this.tagsList = Array.from(
      new Set(
        this.data.flatMap(service => service.tags || [])
      )
    );
  }

  /**
   * @description Parses filters from a query URL.
   * @param {string} url - The full API URL with query parameters.
   * @return {void}
   */
  parseUrlFilters(url) {
    const parsed = new URL(url);
    const params = new URLSearchParams(parsed.search);
  
    this.opts = {};
    this.tags = [];
    this.getTags();

  
    const tags = params.get('tags');
    if (tags && tags.startsWith('cs.{')) {
      this.opts.tags = tags.slice(4, -1).split(',');
    }
  
    const statusRaw = params.get('service_status');
    if (statusRaw?.startsWith('eq.')) {
      this.opts.status = statusRaw.slice(3).toLowerCase();
    }
  
    const orSearch = params.get('or');
    if (orSearch) {
      const searchMatch = orSearch.match(/\*([^\*]+)\*/);
      if (searchMatch) {
        this.opts.search = searchMatch[1];
        this.search = searchMatch[1];
      }
    }
  
    const isDev = params.get('is_dev');
    if (isDev === 'eq.true' || isDev === 'eq.false') {
      this.opts.is_dev = isDev === 'eq.true';
      this.is_dev = this.opts.is_dev;
    }

    this.requestUpdate();
  }

  /**
   * @description Loads data from the service model.
   * @return {Promise<void>}
   */
  async getData(){
    if ( !this.appComponentController.isOnActivePage() ) return;

    let is_public = false;
    let is_brief = true;
    let r;

    if (!this.isUserEditingUrl) {
      r = await this.ServiceModel.query(this.opts, is_brief, is_public);
      if ( r.state !== 'loaded' ) return;

      this.url = r.fullUrl;
    } else {
      r = await this.ServiceModel.query(this.opts, is_brief, is_public, this.url);
      if ( r.state !== 'loaded' ) return;
      
      this.parseUrlFilters(this.url);
    }

    this.data = r.payload;

    this.isUserEditingUrl = false;

    this.requestUpdate();
  }

}

customElements.define('service-query', ServiceQuery);
