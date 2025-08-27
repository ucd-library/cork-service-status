import * as dotenv from 'dotenv'
dotenv.config();


/**
 * @description Server configuration file. Reads environment variables and sets defaults.
 * To pass any of these variables to the browser, see static.js
 */
class ServerConfig {
    constructor() {
  
      this.version = this.getEnv('APP_VERSION', '0.0.1');
      this.env = process?.env?.APP_ENV === 'dev' ? 'dev' : 'prod';
      
      this.apiRoot = this.getEnv('API_URL', 'http://localhost:3001/');

      this.port = {
        container: this.getEnv('APP_CONTAINER_PORT', 3000), // server port within docker container
        host: this.getEnv('APP_HOST_PORT', 3000), // server port on host machine
      }
  
  
      // Made available to the browser-side app, so don't put any secrets here.
      this.auth = {
        // forces browser-side authentication. Browser then passes auth token to server.
        requireAuth: this.getEnv('APP_REQUIRE_AUTH', true),
  
        // passed to the browser-side keycloak library initialization
        keycloakJsClient: {
          url: this.getEnv('APP_KEYCLOAK_URL', 'https://auth.library.ucdavis.edu'),
          realm: this.getEnv('APP_KEYCLOAK_REALM', 'internal'),
          clientId: this.getEnv('APP_KEYCLOAK_CLIENT_ID', 'cork-service-status')
        },
        oidcScope: this.getEnv('APP_OIDC_SCOPE', 'profile ucd-ids'),
        serverCacheExpiration: this.getEnv('APP_SERVER_CACHE_EXPIRATION', '12 hours')
      };
  
    }
  
  
    /**
     * @description Get an environment variable.  If the variable is not set, return the default value.
     * @param {String} name - The name of the environment variable.
     * @param {*} defaultValue - The default value to return if the environment variable is not set.
     * @returns
     */
    getEnv(name, defaultValue=false){
      let v;
      const env = process?.env?.[name]
      if ( env ) {
        if ( env.toLowerCase() == 'true' ) return true;
        if ( env.toLowerCase() == 'false' ) return false;
        return env;
      }
      return defaultValue;
    }
  }
  
  export default new ServerConfig();
  