import { LitElement } from 'lit';
import {render, styles} from "./service-card.tpl.js";
import '@ucd-lib/theme-elements/brand/ucd-theme-collapse/ucd-theme-collapse.js';

/**
 * @description retrievs service object and displays service details 
 * such as name, title, tags, and status
 */
export default class ServiceCard extends LitElement {

  static get properties() {
    return {
      service: {type: Object, attribute:'service'},
    }
  }

  static get styles() {
    return styles();
  }

  constructor() {
    super();
    this.render = render.bind(this);
    this.service = {};

  }

  /**
   * @description Handles click event on the service card.
   * @return {void}
   */
  clickCard(){
    console.log("Clicked Card:", this.service);
  }

  /**
   * @description Converts a string to title case (each word capitalized).
   * @param {string} str - The input string.
   * @return {string} Title-cased version of the input string.
  */
  toTitleCase(str) {
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * @description Lifecycle method called when the element is added to the DOM.
   * @return {void}
   */
  connectedCallback() {
    super.connectedCallback();

  }

}

customElements.define('service-card', ServiceCard);