import { LitElement } from 'lit';
import {render, styles} from "./app-page-home.tpl.js";
import {Mixin, MainDomElement} from '@ucd-lib/theme-elements/utils/mixins/index.js';
import { LitCorkUtils } from '@ucd-lib/cork-app-utils';

export default class AppPageHome extends Mixin(LitElement)
  .with(MainDomElement, LitCorkUtils) {

  static get properties() {
    return {
      pageId: { type: String, attribute: 'page-id' }
    }
  }

  static get styles() {
    return styles();
  }

  constructor() {
    super();
    this.render = render.bind(this);
    this.service = {
      name: 'steak',
      title: 'instead live aside',
      tags: [ 'tag1', 'tag5', 'tag4' ],
      user: {
      creator_firstName: 'Joey',
      creator_lastName: 'Schroeder',
      username: 'Lora.Will'
      },
      serviceProperties: [
        {
          name: 'support_url',
          valueOrder: 0,
          value: [ 'https://cautious-thorn.com' ]
        },
        {
          name: 'technical_lead_backup',
          valueOrder: 1,
          value: "Dr. Ellen O'Connell",
          role: 'public'
        },
        {
          name: 'restart_instructions',
          valueOrder: 2,
          value: '- `parse system`: Try to hack the RAM alarm, maybe it will connect the mobile transmitter!\n' +
            "- `generate matrix`: You can't calculate the pixel without indexing the bluetooth EXE capacitor!\n" +
            "- `generate transmitter`: transmitting the program won't do anything, we need to connect the redundant TCP matrix!\n" +
            '- `reboot panel`: The HEX matrix is down, hack the online pixel so we can quantify the CLI array!',
          role: 'public'
        },
        { name: 'is_dev', valueOrder: 3, value: true },
        {
          name: 'admin_url',
          valueOrder: 4,
          value: [
            'https://empty-best-seller.info/',
            'https://joyful-molasses.net/',
            'https://posh-heating.info',
            'https://front-tomb.info'
          ],
          role: 'public'
        }
      ]
  }
  }

}

customElements.define('app-page-home', AppPageHome);
