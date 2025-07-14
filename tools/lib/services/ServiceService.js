import {BaseService} from '@ucd-lib/cork-app-utils';
import ServiceStore from '../stores/ServiceStore.js';

class ServiceService extends BaseService {

  constructor() {
    super();
    this.store = ServiceStore;
  }

}

const service = new ServiceService();
export default service;