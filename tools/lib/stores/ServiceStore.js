import {BaseStore} from '@ucd-lib/cork-app-utils';

class ServiceStore extends BaseStore {

  constructor() {
    super();

    this.data = {};
    this.events = {};
  }

}

const store = new ServiceStore();
export default store;