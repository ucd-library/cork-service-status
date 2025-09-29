import {BaseService} from '@ucd-lib/cork-app-utils';
import ServiceStore from '../stores/ServiceStore.js';
import payload from '../payload.js';

class ServiceService extends BaseService {

  constructor() {
    super();
    this.store = ServiceStore;
    this.baseUrl = 'http://localhost:3001/';
  }

  async query(opts, url){
    const id = payload.getKey(opts);
    const store = this.store.data.query;
    let fullUrl;
    if(url != ''){
      fullUrl = url;
    }else{
      let tab = opts?.view === 'full' ? 'service_view_full' : 'service_view_brief';
      const table = opts.is_public ? tab + "_public": tab;
      const url = `${this.baseUrl}${table}`;

      // construct postgrest query string
      const qs = {};

      if (opts.service_id) {
        qs.service_id = `eq.${opts.service_id}`;
      }

      if (opts.tags?.length) {
        qs.tags = `cs.{${opts.tags.join(',')}}`;
      }

      if (opts.status) {
        qs.service_status = `eq.${opts.status}`;
      }

      if (opts.search) {
        qs.or = `(title.ilike.*${opts.search}*,name.ilike.*${opts.search}*)`;
      }
      if (typeof opts.is_dev === 'boolean') {
        qs.is_dev = `eq.${opts.is_dev}`;
      }

      fullUrl = url; 

      

      if (Object.keys(qs).length !== 0) {
        const urlParams = new URLSearchParams(qs);
        fullUrl = `${url}?${urlParams.toString()}`;
      }
    }

    await this.checkRequesting(
      id, store,
      () => this.request({
        url: fullUrl,
        checkCached: () => store.get(id),
        onUpdate: resp => this.store.set(
          {...resp, id, ...opts, fullUrl},
          store
        )
      })
    );

    return store.get(id);

  }

  async create(data){
    return await this.request({
      url: `/api/services`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
      body: JSON.stringify(data)
    });
  }

  async update(id, data) {
    return this.request({
      url: `/api/services?service_id${encodeURIComponent(id)}`,
      method: 'PUTs',
      headers: {
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(data),
      onUpdate: (resp) => this.store.setCurrent(Array.isArray(resp) ? resp[0] : resp)
    });
  }

  async remove(id){
    return this.request({
      url: `/api/services?service_id${encodeURIComponent(id)}`,
      method: 'DELETE',
      onUpdate: resp => this.store.remove(id, this.store.data.current)
    });
  }

}

const service = new ServiceService();
export default service;
