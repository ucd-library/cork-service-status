import {BaseStore, LruStore} from '@ucd-lib/cork-app-utils';

class ServiceStore extends BaseStore {

  constructor() {
    super();

    this.data = {
      query: new LruStore({name: 'service.query'})
    };
    this.events = {};
  }

}

const store = new ServiceStore();
export default store;
