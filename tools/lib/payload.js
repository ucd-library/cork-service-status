import {PayloadUtils} from '@ucd-lib/cork-app-utils'

const ID_ORDER = ['view', 'service_id', 'url', 'tags', 'status', 'search', 'is_dev'];

let inst = new PayloadUtils({
  idParts: ID_ORDER
});

export default inst;
