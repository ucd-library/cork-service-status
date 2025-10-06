import { LitElement } from 'lit';
import {styles} from "./service-form.tpl.js";
import * as Templates from "./service-form.tpl.js";

import { LitCorkUtils, Mixin } from '@ucd-lib/cork-app-utils';
import AppComponentController from '../../../controllers/AppComponentController.js';
import ValidationHandler from '../../../../../lib/validation.js';
export default class ServiceForm extends Mixin(LitElement)
  .with(LitCorkUtils) {

  static get properties() {
    return {
      serviceId: {type: String, attribute: 'service-id'},
      service: {type: Object, attribute: 'service'},
      serviceProperties: {type: Array},
      _dragId: {state: true},
      _newTag: { state: true }
    }
  }

  static get styles() {
    return styles();
  }

  constructor() {
    super();
    this.render = Templates.render.bind(this);
    this.renderForm = Templates.renderForm.bind(this);
    this.renderConfirmation = Templates.renderConfirmation.bind(this);

    this.data = {};
    this.serviceId = null;
    this.service = {};
    this.serviceProperties = [];
    this._newTag = '';
    this.updateForm = false;
    this.appComponentController = new AppComponentController(this);
    this._dragId = null;
    this._formChanged = false;
    this.confirmationMessage = '';
    console.log();

    this.servicePropertiesOptions = [
      { title: 'Development Service', type: 'boolean', name: 'is_dev', present: false},
      { title: 'Service URL', type: 'array', name: 'url', present: false},
      { title: 'Service Admin URL', type: 'array', name: 'admin_url', present: false},
      { title: 'Technical lead', type: 'string', name: 'technical_lead',  present: false},
      { title: 'Backup Technical lead', type: 'string', name: 'technical_lead_backup', present: false},
      { title: 'Support URL', type: 'array', name: 'support_url', present: false},
      { title: 'Health Dashboard', type: 'array', name: 'health_dashboard', present: false},
      { title: 'Restart Instructions', type: 'markdown', name: 'restart_instructions', present: false},
    ];
    this.validationHandler = new ValidationHandler();

    this._injectModel('AppStateModel', 'ServiceModel');
  }

  connectedCallback() {
    super.connectedCallback();
    this.parseData();
  }

  /**
   * @description Parse data for form
   * @returns {Promise<void>}
   */
  async parseData() {
    if ( !this.serviceId && !Object.keys(this.service).length ) {
      this.updateForm = false;
      this.page = 'form';

      return;
    };

    this.updateForm = true;
    this.addPresentOptions();


    let res = await this.ServiceModel.query({service_id:this.serviceId}, false);

    this.service = res.payload[0];
    this.serviceProperties = this.service?.service_properties || [];

    this.originalService = structuredClone(this.service);
    this.originalServiceProperties = structuredClone(this.serviceProperties)

    this.page = 'form';

    this.requestUpdate();
  }

  updated(changes){

    if( changes.has('service') || changes.has('serviceProperties') ){
      this.activateSubmit();
    }
    
  }

  /**
   * @description Reset form information to original values
   * @param {String|null} property - if null, reset service info, otherwise reset service properties
   * @returns {Promise<void>}
   */
  resetInformation(property=null){
    if(!property){
      this.service.name = this.originalService.name;
      this.service.tags = this.originalService.tags;
      this.service.title = this.originalService.title;
      this.service.description = "";
      this.service.role = this.originalService.role ? this.originalService.role: delete this.service.role;
    }
    else {
      this.serviceProperties = this.originalServiceProperties;
    }

    this.requestUpdate();
  }

  /**
   * @description Activate submit button if form has changed
   */
  activateSubmit(){
    if(this.updateForm && !this.originalService) return;

    if(this.service?.name !== this.originalService?.name ||
      this.service?.title !== this.originalService?.title ||
      ((this.service?.description || '') !== (this.originalService?.description || '')) ||
      ((this.service?.role || '') !== (this.originalService?.role || '')) ||
      ((this.service?.tags || []).sort().join(',') !== (this.originalService?.tags || []).sort().join(',')) ||
      JSON.stringify(this.serviceProperties) !== JSON.stringify(this.originalServiceProperties)
    ){
      this._formChanged = true;
    }

    this.requestUpdate();
  }

  /**
   * @description Check for missing or blank fields
   * @param {Object} obj - object to check
   * @param {Array} fields - array of field names to check
   * @returns {Object} - { ok: Boolean, ismissing: Array }
   */
  _checkFields(obj, fields) {
    const isBlank = v =>
      v == null || // null or undefined
      (typeof v === 'string' && v.trim() === '') || // empty string
      (Array.isArray(v) && v.every(isBlank)) || // empty array or array of blank items
      (v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0); // empty object 

    const ismissing = fields.filter(k => {
      return isBlank(obj?.[k]);
    });

    return { ok: ismissing.length === 0, ismissing };

  }


  //service functions

  /**
   * @description Check for missing or blank fields
   * @returns {void}
  */
  addTag() {
    const raw = (this._newTag || '').trim();
    if (!raw) return;
  
    const incoming = raw.split(/[,\s]+/).map(t => t.trim()).filter(Boolean);
  
    const current = [...(this.service?.tags ?? [])];
    for (const t of incoming) {
      if (!current.includes(t)) current.push(t);
    }
  
    this.service = { ...(this.service || {}), tags: current };
    this._newTag = '';
  }

  /**
   * @description Remove a tag from the service
   * @param {String} tag - tag to remove
   * @returns {void}
   */
  removeTag(tag) {
    const current = (this.service?.tags ?? []).filter(t => t !== tag);
    this.service = { ...(this.service || {}), tags: current };
  }

  /**
   * @description Set service to public or not
   * @param {Boolean} checked - whether to set service to public or not
   * @returns {void}
   */
  _setServicePublic(checked) {
    this.service = { ...(this.service || {}), role: checked };
    if (checked) this.service.role = 'public';
    else delete this.service.role;
    this.requestUpdate();
  }



  // Service Properties

  /**
   * @description Mark service properties as present or not
   * @returns {void}
   */
  addPresentOptions() {
    const used = new Set(
      (this.serviceProperties ?? [])
        .map(sp => (sp.name ?? '').trim())
        .filter(Boolean)
    );
  
    this.servicePropertiesOptions = (this.servicePropertiesOptions ?? []).map(opt => {
      const key = (opt.name ?? '').trim();
      return { ...opt, present: used.has(key) };
    });
  
    this.requestUpdate();
  }
  
  /**
   * @description Reindex service properties list
   * @param {Array} list - list of service properties
   * @returns {Array} - reindexed list
   */
  _reindex(list) { return list; }


  /**
   * @description Add a new service property
   * @returns {void}
   */
  _addItem(){
    const next = [
      ...(this.serviceProperties ?? []),
      { name: '', values: [] }
    ];
    this.serviceProperties = this._reindex(next);
  };

  /**
   * @description Remove a service property
   * @param {String} id - id of service property to remove
   * @returns {void}
   */
  _removeItem(id) {
    const next = (this.serviceProperties ?? []).filter(it => it.name !== id);
    this.serviceProperties = this._reindex(next);
  }

  /**
   * @description Set service property to public or not
   * @param {String} name - name of service property
   * @param {Boolean} checked - whether to set service property to public or not
   * @returns {void}
   */
  _setServicePropertyPublic(name, checked) {
    this.serviceProperties = (this.serviceProperties ?? []).map(sp => {
      if (sp.name !== name) return sp;
      const next = { ...sp };
      if (checked) next.role = 'public';
      else delete next.role;
      return next;
    });
    this.requestUpdate();
  }

  /**
   * @description Update boolean service property value
   * @param {Number} idx - index of service property to update
   * @param {Boolean} checked - new value
   * @returns {void}
   */
  _booleanUpdate(idx, checked) {
    this.serviceProperties = (this.serviceProperties ?? []).map((sp, i) => {
      if (i !== idx) return sp;
      return { ...sp, values: [{ value: !!checked, order: 0 }] };
    });
    this.requestUpdate();
  }

  /**
   * @description Update service property name
   * @param {Number} idx - index of service property to update
   * @param {String} newName - new name
   * @returns {void}
   */
  _onNameChange(idx, newName) {
    const opt = (this.servicePropertiesOptions ?? []).find(o => o.name === newName);
  
    this.serviceProperties = (this.serviceProperties ?? []).map((sp, i) => {
      if (i !== idx) return sp;
  
      // pull current primitive values from values[]
      const curr = Array.isArray(sp.values) ? sp.values : [];
      const prims = curr.map(v => (v && typeof v === 'object' && 'value' in v) ? v.value : v);
  
      let values = [];
  
      if (!newName || !newName.trim()) {
        values = [];
      } else if (opt?.type === 'boolean') {
        const first = (prims.length ? prims[0] : false);
        values = [{ value: !!first, order: 0 }];
      } else if (opt?.type === 'array') {
        // ensure an array of strings (split any single string on newlines)
        const arr = Array.isArray(prims[0])
          ? prims[0]
          : (prims.length > 1 ? prims : String(prims[0] ?? '').split(/\r?\n/));
        values = arr
          .map((v, i2) => ({ value: v, order: i2 }))
          .filter(x => String(x.value ?? '').trim() !== '');
      } else { // string / markdown
        const s = prims.length > 1 ? prims.join('\n') : String(prims[0] ?? '');
        values = [{ value: s, order: 0 }];
      }
  
      return { ...sp, name: newName, values };
    });
  
    this.addPresentOptions();
    this.requestUpdate();
  }

  /**
   * @description Convert service property value to string for display in text input
   * @param {Object} item - service property item
   * @returns {String} - string representation of service property value
   */
  _valueToString(item) {
    if (!item) return '';
    const t = this._optionTypeFor(item.name);
    const v0 = Array.isArray(item.values) && item.values.length
      ? (item.values[0]?.value ?? item.values[0])
      : '';
    if (t === 'boolean') return v0 ? 'true' : 'false';
    return String(v0 ?? '');
  }

  /**
   * @description Get option type for service property name
   * @param {String} name - name of service property
   * @returns {String} - type of service property (string, boolean, array, markdown)
   */
  _optionTypeFor(name) {
    const opt = (this.servicePropertiesOptions ?? []).find(o => o.name === name);
    return opt?.type ?? 'string';
  }

  /**
   * @description Update service property value from text input
   * @param {String} id - id of service property to update
   * @param {String} raw - new value from text input
   * @returns {void}
   */
  _onValueInput(id, raw) {
    const next = (this.serviceProperties ?? []).map(sp => {
      if (sp.name !== id) return sp;
      const t = this._optionTypeFor(sp.name);
  
      if (t === 'array') {
        const arr = String(raw).split(/\r?\n/).map(s => s.trim()).filter(Boolean);
        return { ...sp, values: arr.map((v, i) => ({ value: v, order: i })) };
      } else if (t === 'boolean') {
        const b = /^(true|1|yes|on)$/i.test(String(raw).trim());
        return { ...sp, values: [{ value: b, order: 0 }] };
      } else {
        return { ...sp, values: [{ value: raw, order: 0 }] };
      }
    });
    this.serviceProperties = next;
    this.requestUpdate();
  }

  /**
   * @description Update service property array value from text input
   * @param {Number} idx - index of service property to update
   * @param {Number} indexInArray - index of value in array to update
   * @param {String} newVal - new value from text input
   * @returns {void}
   */
  _onArrayValueInput(idx, indexInArray, newVal) {
    const next = (this.serviceProperties ?? []).map((sp, i) => {
      if (i !== idx) return sp;
      const arr = Array.isArray(sp.values) ? [...sp.values] : [];
      arr[indexInArray] = { value: newVal, order: indexInArray };
      return { ...sp, values: arr };
    });
    this.serviceProperties = next;
    this.requestUpdate();
  }
  
  /**
   * @description Add a new value to a service property array
   * @param {Number} idx - index of service property to update
   * @returns {void}
   */
  _addArrayValue(idx) {
    const next = (this.serviceProperties ?? []).map((sp, i) => {
      if (i !== idx) return sp;
      const arr = Array.isArray(sp.values) ? [...sp.values] : [];
      arr.push({ value: '', order: arr.length });
      return { ...sp, values: arr };
    });
    this.serviceProperties = next;
  }
  
  /**
   * @description Remove a value from a service property array
   * @param {Number} indexInArray - index of value in array to remove
   * @param {Number} idx - index of service property to update
   * @returns {void}
   */
  _removeArrayValue(idx, indexInArray) {
    const next = (this.serviceProperties ?? []).map((sp, i) => {
      if (i !== idx) return sp;
      const arr = Array.isArray(sp.values) ? [...sp.values] : [];
      arr.splice(indexInArray, 1);
      // reindex orders
      const re = arr.map((v, i2) => ({ value: v?.value ?? v, order: i2 }));
      return { ...sp, values: re };
    });
    this.serviceProperties = next;
  }

  /**
   * @description Handle drag start event
   * @param {String} id - id of service property to drag
   * @returns {void}
   */
  _onDragStart(id) { this._dragId = id; }

  /**
   * @description Handle drag over event
   * @param {Event} e - drag over event
   * @returns {void}
   */
  _onDragOver(e) { e.preventDefault(); }


  /**
   * @description Handle drop event
   * @param {String} targetId - id of service property to drop on
   * @returns {void}
   */
  _onDrop(targetId) {
    if (!this._dragId || this._dragId === targetId) return;
  
    const next = [...(this.serviceProperties ?? [])];
    const from = next.findIndex(it => it.name === this._dragId);
    const to   = next.findIndex(it => it.name === targetId);
    if (from < 0 || to < 0) return;
  
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
  
    this.serviceProperties = this._reindex(next);
    this._dragId = null;
  }

  //Submit forms and service calls

  /** Event Handlers */
  
  /**
   * @description Attached to Service Model CREATE_SERVICE event
   * @param {Object} e
   */

  _onCreateService(e) {
    if(e.state == this.ServiceModel.store.STATE.LOADED) {
      let serviceName = this.service.name.charAt(0).toUpperCase() + this.service.name.slice(1);
      this.confirmationMessage = `${serviceName} service has been created. Below is the new service information:`;
      this.page = 'confirmation';
    }
    else if(e.state == this.ServiceModel.store.STATE.ERROR) {
      this.AppStateModel.showError(e.error.message);
      return;
    }
    this.requestUpdate();
  }

   /**
   * @description Attached to Service Model UPDATE_SERVICE event
   * @param {Object} e
   */
  _onUpdateService(e) {
    if(e.state == this.ServiceModel.store.STATE.LOADED) {
      let serviceName = this.service.name.charAt(0).toUpperCase() + this.service.name.slice(1);
      this.confirmationMessage = `${serviceName} service has been updated. Below is the updated service information:`;
      this.page = 'confirmation';
      this.serviceId = e.payload.body;

    }
    else if(e.state == this.ServiceModel.store.STATE.ERROR) {
      this.AppStateModel.showError(e.error.message);
      return;
    }
    this.requestUpdate();
  }

  /**
   * @description Submit form data to create or update service
  */
  async submitForm(){
    let missingServiceFields;
    
    missingServiceFields = this._checkFields(this.service, ['name', 'title']);
    if ( !missingServiceFields.ok ) {
      this.AppStateModel.showToast(`Please fill in the required fields: ${missingServiceFields.ismissing.join(', ')}`, 'error');
      return;
    }

    if( this.serviceProperties.length !== 0 ){
      let props = Array.isArray(this.serviceProperties) ? this.serviceProperties : [];
      if (props.length === 0) return true;

      let failures = props.map((sp) => {

        //find type of option boolean, array .etc
        let type = this._optionTypeFor(sp.name); 
        let values = Array.isArray(sp.values) ? sp.values : [];

        const rawValues = values.map(v =>
          (v && typeof v === 'object' && 'value' in v) ? v.value : v
        );


        const first = rawValues[0];

        let changedVal;
        if (type === 'boolean') {
          changedVal = (typeof first === 'boolean') ? first : null;
        } else if (type === 'array') {
          changedVal = rawValues.filter(v => v != null && v !== '');
        } else {
          changedVal = (first != null) ? first : '';
        }

        let missingFields = this._checkFields({ name: sp.name, values: rawValues }, ['name', 'values']);
        return { property: sp.name || '(unnamed)', ok: missingFields.ok, ismissing: missingFields.ismissing, type };

      });
      
      failures = failures.filter((r) => { return !r.ok; });

      if ( failures.length ) {
        const missingList = failures
          .map((r)  => {
            return r.property + (r.ismissing.length ? ' (' + r.ismissing.join(', ') + ')' : '');
          })
          .join(', ');

        this.AppStateModel.showToast(`Please fill in the required fields: ${missingList}`, 'error');
        return;
      }
    }

    this.AppStateModel.showToast('Submitting form...', 'info');


    const formData = {
      ...this.service,
      service_properties: this.serviceProperties
    };

    formData.user = {
      creator_firstName: 'userFirstName',
      creator_lastName: 'userLastName',
      username: 'username'
    }


    if(this.updateForm){
      await this.ServiceModel.updateService(formData);
    }else{
      await this.ServiceModel.createService(formData);
    }
    
    this.requestUpdate();
  }

    /**
   * @description Navigate to form page
   * @returns {void}
   */
    navigateToForm(){
      this.parseData();
      window.location.reload();
    }
  

}

customElements.define('service-form', ServiceForm);
