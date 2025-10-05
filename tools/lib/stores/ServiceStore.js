import {BaseStore, LruStore} from '@ucd-lib/cork-app-utils';

class ServiceStore extends BaseStore {

  constructor() {
    super();

    this.data = {
      query: new LruStore({name: 'service.query'}),
      createService: new LruStore({name: 'service.create'}),
      updateService: new LruStore({name: 'service.update'}),
      removeService: new LruStore({name: 'service.remove'})

    };
    this.events = {
      CREATE_SERVICE: 'create-service',
      UPDATE_SERVICE: 'update-service',
      REMOVE_SERVICE: 'remove-service',
    };

    this.errorSettings = {
      'service.query': {
        message: 'Unable to retrieve list of services'
      },
      'service.create': {
        message: 'Unable to create service'
      },
      'service.update': {
        message: 'Unable to update service'
      },
      'service.remove': {
        message: 'Unable to remove service'
      }
    }

  }

  createServiceLoading(request) { 
    this._setCreateServiceState({
      state : this.STATE.LOADING,
      request
    });
  }

  createServiceLoaded(payload) {
    this._setCreateServiceState({
      state : this.STATE.LOADED,
      payload
    });
  }

  createServiceError(error) {
    this._setCreateServiceState({
      state : this.STATE.ERROR,
      error
    });
  }

  _setCreateServiceState(state) {
    this.data.createService = state;
    this.emit(this.events.CREATE_SERVICE, state);
  }

  updateServiceLoading(request, id) { 
    this._setUpdateServiceState({
      state : this.STATE.LOADING,
      request
    }, id);
  }

  updateServiceLoaded(payload, id) {
    this._setUpdateServiceState({
      state : this.STATE.LOADED,
      payload
    }, id);
  }

  updateServiceError(error, id) {
    this._setUpdateServiceState({
      state : this.STATE.ERROR,
      error
    }, id);
  }

  _setUpdateServiceState(state) {
    this.data.updateService = state;
    this.emit(this.events.UPDATE_SERVICE, state);
  }


}

const store = new ServiceStore();
export default store;
