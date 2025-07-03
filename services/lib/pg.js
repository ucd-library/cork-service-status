import { config } from 'dotenv';
import pg from 'pg';
const { Pool } = pg;

config();


/**
 * @description class for pg library 
 */
class Pg {
    constructor() {

      this.pool = new Pool({
        user: process.env.POSTGRES_USER,
        host: process.env.POSTGRES_HOST,
        database: process.env.POSTGRES_DATABASE,
        password: process.env.POSTGRES_PASSWORD,
        port: Number(process.env.POSTGRES_PORT),
      });

    }

  async getClient() {
    return await this.pool.connect();
  }

  /**
   * @description https://node-postgres.com/features/queries
   * @param {String} text - SQL
   * @param {Array} values - Hydration values
   * @returns {Object} {res, err}
   */
  async query(text, values){
    const out = this.output;
    try {
      out.res = await pool.query(text, values);
    } catch (error) {
      out.err = error;
    }
    return out;
  }

    /**
     * @description Return a formatted error response
     * @param {String} message - Error message
     * @returns {Object}
     */
    returnError(message){
      const out = this.output;
      out.err = {};
      if ( message ) out.err.message = message;
      return out;
    }
  
    /**
     * @description Constructs Values array for INSERT statement given a list of values for hydration
     * @param {Array} values - List of values to sub into insert statement
     * @param {Number} offset - Number to offset the list of values
     * @returns {String} ($1, $2, $3), etc
     */
    valuesArray(values, offset=0){
      if ( !values || !Array.isArray(values) ) return '';
      return `(${values.map((v, i) => `$${i + 1 + offset}`).join(', ')})`;
    }
  
    /**
     * @description Converts an object to parameters of a WHERE clause
     * @param {Object} queryObject - key value pairs for clause
     * @param {Boolean} underscore - Convert keys to underscore
     * @param {Boolean} useOr - Use OR instead of AND
     * @returns {Object} {sql: 'foo = $1 AND bar = $2', values: ['fooValue', 'barValue]}
     */
    toWhereClause(queryObject, underscore, useOr=false){
      return this._toEqualsClause(queryObject, useOr ? ' OR ' : ' AND ', underscore);
    }
  
    /**
     * @description Converts an object to parameters of a UPDATE clause
     * @param {Object} queryObject - key value pairs for clause
     * @param {Boolean} underscore - Convert keys to underscore
     * @returns {Object} {sql: 'foo = $1, bar = $2', values: ['fooValue', 'barValue]}
     */
    toUpdateClause(queryObject, underscore){
      return this._toEqualsClause(queryObject, ', ', underscore);
    }
  
    _toEqualsClause(queryObject, sep=' AND ', underscore){
      let sql = '';
      const values = [];
      if ( queryObject && typeof queryObject === 'object' ){
        for (const [i, k] of (Object.keys(queryObject)).entries()) {
          values.push(queryObject[k]);
          sql += `${i > 0 ? sep : ''}${underscore ? TextUtils.underscore(k) : k}=$${i+1}`;
        }
      }
      return {sql, values};
    }





}
export default new Pg();
