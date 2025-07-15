import {BaseService} from '@ucd-lib/cork-app-utils';
import ServiceStore from '../stores/ServiceStore.js';
import payload from '../payload.js';

class ServiceService extends BaseService {

  constructor() {
    super();
    this.store = ServiceStore;
    this.baseUrl = 'http://localhost:3001/';
  }

  async query(opts){
    const id = payload.getKey(opts);
    const store = this.store.data.query;
    const table = opts?.view === 'full' ? 'service_view_full' : 'service_view_brief';
    const url = `${this.baseUrl}${table}`;

    // construct postgrest query string
    const qs = {};

    await this.checkRequesting(
      id, store,
      () => this.request({
        url,
        qs,
        checkCached: () => store.get(id),
        onUpdate: resp => this.store.set(
          {...resp, id, ...opts},
          store
        )
      })
    );

    return store.get(id);

  }

}

const service = new ServiceService();
export default service;
