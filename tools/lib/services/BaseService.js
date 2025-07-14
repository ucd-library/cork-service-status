import { BaseService } from '@ucd-lib/cork-app-utils';

/**
 * @class BaseServiceImp
 * @description Extends the cork-app-utils BaseService to add auth headers to requests
 * Import this class instead of BaseService directly from @ucd-lib/cork-app-utils
 */
export default class BaseServiceImp extends BaseService {
  constructor() {
    super();
  }

  /**
   * @description ...
   */
  async request(options){
    const r = await super.request(options);

    return r;
  }
}
