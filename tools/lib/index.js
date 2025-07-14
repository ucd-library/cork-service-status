import { Registry } from '@ucd-lib/cork-app-utils';

import appStateModel from './models/AppStateModel.js';
import serviceModel from './models/ServiceModel.js';

Registry.ready();

export {
  appStateModel,
  serviceModel
};
