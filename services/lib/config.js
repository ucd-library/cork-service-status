class Config {
  constructor(){

    this.app = this.getAppConfig();
  }

  /**
   * @description Get the application configuration object written by the SPA middleware
   * @returns {Object} - Returns the application configuration object.
   */
  getAppConfig(){
    if (typeof window !== 'undefined' && window.APP_CONFIG) {
      return window.APP_CONFIG;
    }
    return {};
  }

  /**
   * @description Get an environment variable.  If the variable is not set, return the default value.
   * @param {String} name - The name of the environment variable.
   * @param {*} defaultValue - The default value to return if the environment variable is not set.
   * @param {Boolean|String} errorIfMissing - Throws an error if the environment variable is not set.
   * If true, throws an error in both browser and server environments.
   * If 'browser', throws an error only in the browser.
   * If 'server', throws an error only on the server.
   * @returns
   */
  getEnv(name, defaultValue=false, errorIfMissing=false){
    let value;
    if( typeof window !== 'undefined' ) {
      value = window.APP_CONFIG?.[name];
      errorIfMissing = errorIfMissing === true || errorIfMissing === 'browser';
    } else {
      value = process?.env?.[name];
      errorIfMissing = errorIfMissing === true || errorIfMissing === 'server';
    }
    if (value === undefined || value === null) {
      if (errorIfMissing) {
        throw new Error(`Environment variable ${name} is not set`);
      }
      return defaultValue;
    }

    if ( value?.toLowerCase?.() === 'false' ) {
      value = false;
    } else if ( value?.toLowerCase?.() === 'true' ) {
      value = true;
    }
    return value;

  }
}

export default new Config();
