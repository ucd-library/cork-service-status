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

}

const model = new ServiceModel();
export default model;