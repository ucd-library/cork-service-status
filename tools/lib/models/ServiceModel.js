import {BaseModel} from '@ucd-lib/cork-app-utils';
import ServiceService from '../services/ServiceService.js';
import ServiceStore from '../stores/ServiceStore.js';

class ServiceModel extends BaseModel {

  constructor() {
    super();

    this.store = ServiceStore;
    this.service = ServiceService;

    this.register('ServiceModel');
  }

  async query(opts={}, is_brief=true, is_public=false, url=''){
    opts = is_brief ? { view: 'brief', is_public,  ...opts }: { view: 'full', is_public, ...opts };
    const r = await this.service.query(opts, url);

    return r;
  }

}

const model = new ServiceModel();
export default model;
