import { LitElement } from 'lit';
import {render, styles} from "./service-form.tpl.js";
import { LitCorkUtils, Mixin } from '@ucd-lib/cork-app-utils';
import AppComponentController from '../../../controllers/AppComponentController.js';
import ValidationHandler from '../../../../../lib/validation.js';
export default class ServiceForm extends Mixin(LitElement)
  .with(LitCorkUtils) {

  static get properties() {
    return {
    //   serviceId: {type: String, attribute: 'service-id'},
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
    this.render = render.bind(this);
    this.data = {};
    this.service = {};
    this.serviceProperties = [];
    this._newTag = '';
    this.updateForm = false;
    this.appComponentController = new AppComponentController(this);
    this._dragId = null;
    this._formChanged = false;
    this.servicePropertiesOptions = [
      { title: 'Development Service', type: 'boolean', name: 'is_dev', present: false},
      { title: 'Service URL', type: 'array', name: 'url', present: false},
      { title: 'Service Admin URL', type: 'array', name: 'admin_url', present: false},
      { title: 'Technical lead', type: 'string', name: 'technical_lead',  present: false},
      { title: 'Backup Technical lead', type: 'string', name: 'technical_lead_backup', present: false},
      { title: 'Support URL', type: 'array', name: 'support_url', present: false},
      { title: 'Health Dashboard', type: 'string', name: 'health_dashboard', present: false},
      { title: 'Restart Instructions', type: 'markdown', name: 'restart_instructions', present: false},
    ];
    this.validationHandler = new ValidationHandler();

    this._injectModel('AppStateModel', 'ServiceModel');
  }

  connectedCallback() {
    super.connectedCallback();
    this.parseData();
  }

  _onAppStateUpdate() {
    this.parseData();
  }

  firstUpdated() {
    this.originalService = this.service;
    this.originalServiceProperties = this.serviceProperties;

    if (this.service && Object.keys(this.service).length) {
      this.updateForm = true;
      this.addPresentOptions();
    } else {
      this.updateForm = false;
    }
    this.requestUpdate();
  }


  updated(changeProps) {
    const deepEqual = (prev, next) => {
      JSON.stringify(prev) === JSON.stringify(next)
    };

    if(changeProps.get('service') == undefined &&  
       changeProps.get('serviceProperties') == undefined) 
        return;

    let serviceChange = !deepEqual(this._originalService, this.service);
    let servicePropChange = !deepEqual(this.originalServiceProperties, this.serviceProperties);
    this._formChanged = serviceChange || servicePropChange;

    this.requestUpdate();
  }



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

  addPresentOptions() {
    const used = new Set(
      (this.serviceProperties ?? [])
        .map(sp => (sp.name ?? '').trim())
        .filter(Boolean)
    );
  
    this.servicePropertiesOptions = (this.servicePropertiesOptions ?? []).map(opt => {
      const key = (opt.name ?? '').trim();
      const present = used.has(key) ? true : false; // explicit true/false
      return { ...opt, present };
    });

  
    this.requestUpdate();
  }


  parseData() {
    if ( Object.keys(this.service).length === 0 ) return;
    this._originalService = structuredClone(this.service);
    this.serviceProperties = this.service?.serviceProperties || [];

    this.requestUpdate();
  }

  _reindex(list) {
    return list.map((it, i) => ({ ...it, valueOrder: i }));
  }

  _addItem = () => {
    const next = [
      ...this.serviceProperties,
      { 
        name:'', 
        value:'', 
      }
    ];
    this.serviceProperties = this._reindex(next);
  };

  _removeItem(id) {
    const next = this.serviceProperties.filter(it => it.name !== id);
    this.serviceProperties = this._reindex(next);
  }


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

  removeTag(tag) {
    const current = (this.service?.tags ?? []).filter(t => t !== tag);
    this.service = { ...(this.service || {}), tags: current };
  }

  _setServicePublic(checked) {
    this.service = { ...(this.service || {}), role: checked };
    this.requestUpdate();
  }

  _setServicePropertyPublic(name, checked) {
    console.log(name, checked);
    this.serviceProperties = (this.serviceProperties ?? []).map(sp => {
      if (sp.name !== name) return sp;
      const next = { ...sp };
      if (checked) next.role = "public";
      else delete next.role; 
      return next;
    });
    this.requestUpdate();
  }

  _booleanUpdate(checked) {
    this.serviceProperties = (this.serviceProperties ?? []).map(sp => {
      const next = { ...sp };
      next.value = checked ? true: false;
      return next;
    });    
    this.requestUpdate();
  }


  resetInformation(property=null){
    if(!property){
      this.service.name = this._originalService.name;
      this.service.tags = this._originalService.tags;
      this.service.title = this._originalService.title;
    }
    else {
      this.serviceProperties = this._originalService?.serviceProperties || [];
    }

    this.requestUpdate();
  }

  _onNameChange(idx, newName) {
    const opt = (this.servicePropertiesOptions ?? []).find(o => o.name === newName);
    this.serviceProperties = (this.serviceProperties ?? []).map((sp, i) => {
      if (!newName || !newName.trim()) {
        return { ...sp, name: newName, value: '' };
      } 

      if (i !== idx) return sp;
      let value = sp.value;

      if(opt.type == 'boolean'){    
        value = Boolean(value);
      } else if(opt.type == 'array'){
        if (!Array.isArray(value)) {
          value = typeof value === 'string' && value.includes('\n')
            ? value.split(/\r?\n/).map(s => s.trim()).filter(Boolean)
            : value ? [String(value)] : [];
        }
      } else {
        value = Array.isArray(value) ? value.join('\n') : (value ?? '');
      }
  
      return { ...sp, name: newName, value };
    });

    this.addPresentOptions();

    this.requestUpdate();
  }

  _valueToString(item) {
    if (item == null) return '';
    const optType = this._optionTypeFor(item.name);
    if (optType === 'boolean') {
      return item.value ? 'true' : 'false';
    } else {
      return Array.isArray(item.value) ? item.value.join('\n') : String(item.value ?? '');
    }
  }
  _optionTypeFor(name) {
    const opt = (this.servicePropertiesOptions ?? []).find(o => o.name === name);
    return opt?.type ?? 'string';
  }

  _onValueInput(id, raw) {
    const next = (this.serviceProperties ?? []).map(sp => {
      if (sp.name !== id) return sp;
      const t = this._optionTypeFor(sp.name);
      if (t === 'array') {
        return { ...sp, value: raw.split(/\r?\n/).map(s => s.trim()).filter(Boolean) };
      } else if (t === 'boolean') {
        return { ...sp, value: !!raw };
      } else {
        return { ...sp, value: raw };
      }
    });
    this.serviceProperties = next;
    this.requestUpdate();
  }

  _onArrayValueInput(idx, indexInArray, newVal) {
    const next = (this.serviceProperties ?? []).map((sp, i) => {
      if (i !== idx) return sp;
      const arr = Array.isArray(sp.value) ? [...sp.value] : [];
      arr[indexInArray] = newVal;
      return { ...sp, value: arr };
    });
    this.serviceProperties = next;
    this.requestUpdate();
  }
  
  _addArrayValue(idx) {
    const next = (this.serviceProperties ?? []).map((sp, i) => {
      if (i !== idx) return sp;
      const arr = Array.isArray(sp.value) ? [...sp.value] : [];
      arr.push('');
      return { ...sp, value: arr };
    });
    this.serviceProperties = next;
  }
  
  _removeArrayValue(idx, indexInArray) {
    const next = (this.serviceProperties ?? []).map((sp, i) => {
      if (i !== idx) return sp;
      const arr = Array.isArray(sp.value) ? [...sp.value] : [];
      arr.splice(indexInArray, 1);
      return { ...sp, value: arr };
    });
    this.serviceProperties = next;
  }

  _onDragStart(id) {
    this._dragId = id;
  }

  _onDragOver(e) {
    e.preventDefault();
  }

  _onDrop(targetId) {
    if (!this._dragId || this._dragId === targetId) return;

    const next = [...this.serviceProperties];
    const from = next.findIndex(it => it.name === this._dragId);
    const to   = next.findIndex(it => it.name === targetId);
    if (from < 0 || to < 0) return;

    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
  
    this.serviceProperties = this._reindex(next);
    this._dragId = null;

  }

  submitForm(){
    let missingServiceFields, missingServicePropertyFields;
    
    missingServiceFields = this._checkFields(this.service, ['name', 'title']);
    if ( !missingServiceFields.ok ) {
      this.AppStateModel.showToast(`Please fill in the required fields: ${missingServiceFields.ismissing.join(', ')}`, 'error');
      return;
    }

    if( this.serviceProperties.length !== 0 ){
      missingServicePropertyFields = this.serviceProperties.map(property => {
        let missingFields = this._checkFields(property, ['name', 'value']);
        return {property:property.name, ...missingFields};
      });

      const failures = missingServicePropertyFields.filter(r => !r.ok);


      if ( failures.length ) {
        const missingList = failures.flatMap(r => r.missing.map(m => `${r.property}.${m}`));
        this.AppStateModel.showToast(`Please fill in the required fields: ${missingList.join(', ')}`, 'error');
        return {property:property.name, fields:missingFields};
      }
    }

    this.AppStateModel.showToast('Submitting form...', 'info');


    const formData = {
      ...this.service,
      serviceProperties: this.serviceProperties
    };

    if(!formData.user){
        console.log("Add form user data");
    }
    console.log('Submitting form data:', formData);
  }

}

customElements.define('service-form', ServiceForm);
