import {LruStore} from '@ucd-lib/cork-app-utils';
import BaseStore from './BaseStore.js';


class ServiceStore extends BaseStore {

  constructor() {
    super();

    this.data = {
      query: new LruStore({name: 'service.query'})
    };
    this.events = {};

    this.errorSettings = {
      'service.query': {
        message: 'Unable to retrieve list of services'
      }
    }

  }

}

const store = new ServiceStore();
export default store;
