import {BaseService} from '@ucd-lib/cork-app-utils';
import ServiceStore from '../stores/ServiceStore.js';
import payload from '../payload.js';

class ServiceService extends BaseService {

  constructor() {
    super();
    this.store = ServiceStore;
    this.baseUrl = 'http://localhost:3001/';
    this.ID = 'service_id';
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


  async createService(data){
    return this.request({
      url: `${this.baseUrl}rpc/create_service`,
      fetchOptions : {
        method : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({ payload: data })
      },
      onLoading : req => this.store.createServiceLoading(req),
      onLoad : async res => {
        if (!res.response.ok) {
          const err = await res;
          throw new Error(`${res.response.status} ${res.response.statusText} ${err.response.message || err.response.error || ''}`);
        }
        const result = await res;
        this.store.createServiceLoaded(result);
      },
      onError : e => this.store.createServiceError(e)
    });
  }
  
  async updateService(data){
    return this.request({
      url: `${this.baseUrl}rpc/update_service`,
      fetchOptions : {
        method : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({ payload: data })
      },
      onLoading : req => this.store.updateServiceLoading(req),
      onLoad : async res => {
        if (!res.response.ok) {
          const err = await res;
          throw new Error(`${res.response.status} ${res.response.statusText} ${err.response.message || err.response.error || ''}`);
        }
        const result = await res;
        this.store.updateServiceLoaded(result);
      },
      onError : e => this.store.updateServiceError(e)
    });
  }

  // async removeService(id){
  //   return this.request({
  //     url: `/api/services/${encodeURIComponent(id)}`,
  //     fetchOptions : {
  //       method : 'DELETE',
  //     },      
  //     onLoading : request => this.store.removeServiceLoading(request, id),
  //     checkCached : () => this.store.data.removeService,
  //     onLoad : result => this.store.removeServiceLoaded(result.body, id),
  //     onError : e => this.store.removeServiceError(e, id)    
  //   });
  // }

}

const service = new ServiceService();
export default service;
