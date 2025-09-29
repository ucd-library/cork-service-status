import { html } from 'lit';

/**
 * @class ValidationHandler
 * @description Class to handle validation error objects from the server
 * @param {Object} corkError - Error object from a cork-app-utils event
 */
export default class ValidationHandler {

  constructor(corkError={}) {
    this.init(corkError);
    this._errorClass = 'field-error';
    this._errorMessageClass = 'field-error-message';
  }

  /**
   * @description Initialize the ValidationHandler with a corkError object
   * @param {Object} corkError - Error object from a cork-app-utils event
   */
  init(corkError={}){
    this.corkError = corkError;
    this.errorsByField = (corkError?.error?.payload?.fieldsWithErrors || []).reduce((acc, error) => {
      acc[error.jsonName] = error.errors || [];
      return acc;
    }
    , {});

  }

  /**
   * @description Get the error class (if any) for a field
   * @param {String} field - field json name
   * @param {String} subField - optional. subfield json name in error object.
   */
  errorClass(field, subField){
    const errors = this.errorsByField[field];
    if ( !subField ) {
      return  errors ? this._errorClass : '';
    }
    return (errors || []).find(e => e.subField === subField) ? this._errorClass : '';

  }

  /**
   * @description Render error messages for a field (if any)
   * @param {String} field - field name
   * @param {String} subField - optional. subfield name in error object
   * @param {String} classes - optional. Additional classes to add to the error message div
   */
  renderErrorMessages(field, subField, classes=''){
    let messages = this.errorsByField[field] || [];
    if ( subField ) {
      messages = messages.filter(e => e.subField === subField);
    }
    return html`
      <div class='${this._errorMessageClass} ${classes}'>
        ${messages.map(err => html`<div>${err.message}</div>`)}
      </div>
    `
  }

  /**
   * @description Get the first error message for a field
   * @param {String} field - field name
   * @returns {String}
   */
  getFirstErrorMessage(field){
    let message = '';
    if( this.errorsByField[field] && this.errorsByField[field].length > 0 ) {
      message = this.errorsByField[field][0].message;
    }
    return message;
  }

  /**
   * @description Get the error object for a field and error type
   * @param {String} field - field name
   * @param {String} errorType - error type set by the server
   * @returns {Object|undefined}
   */
  getError(field, errorType){
    return this.errorsByField[field] && this.errorsByField[field].find(e => e.errorType === errorType);
  }

}
