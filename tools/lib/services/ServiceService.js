import BaseService from './BaseService.js'
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
    const qs = {};
    console.log('querying service', id, opts);

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
