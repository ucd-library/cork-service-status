/**
 * @description Some common text transformations
 */
class TextUtils {
    constructor() {
    }
  
    /**
     * @description Converts camelCase to underscores (snakecase) for column names
     */
    underscore(s){
      return s.split(/\.?(?=[A-Z])/).join('_').toLowerCase();
    }
  
    /**
     * @description Convert snake_case to camelCase
     * @param {String} s 
     * @returns {String}
     */
    camelCase(s){
      return s.toLowerCase().replace(/([-_][a-z])/g, group =>
      group
        .toUpperCase()
        .replace('-', '')
        .replace('_', '')
      );
    }
  
    /**
     * @description Converts all keys in an object to camelCase
     * @param {Object} o 
     * @returns {Object}
     */
    camelCaseObject(o){
      const out = {};
      for (const k of Object.keys(o)) {
        out[this.camelCase(k)] = o[k];
      }
      return out;
    }
  
  }
  
  export default new TextUtils();