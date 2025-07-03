import pg from "./pg.js";
import TextUtils from "./text.js";


/**
 * @description Manages faker pg data for status page
 */

class Services{
    constructor() {
    }


  /**
   * @method create
   * @description Inserts one or more services along with their related service properties and roles.
   * Each service must have a name, title, tags, and optionally serviceProperties and role.
   * Also associates users and role-based access where specified.
   * 
   * @param {Array<Object>} data - An array of service objects.
   * @returns {Object} Result object with service insertions and errors if any.
   */

  async create(data){
    let out = { res: [], err: false };

    if (!Array.isArray(data)) data = [data];


    for(const service of data){

      const user = await this.ensureUser(service.user.username);
      service.createdBy = user;
      service.updatedBy = user;

      let text = 'INSERT INTO cork_status.service(';
      let props = [
        'name', 'title', 'tags', 'createdBy', 'updatedBy'];
      const values = [];

      let first = true;
      for (const prop of props) {
        if ( service.hasOwnProperty(prop) ){
          if ( first ) {
            text += TextUtils.underscore(prop);
            first = false;
          } else {
            text += `, ${TextUtils.underscore(prop)}`;
          }
          values.push(service[prop]);
        }
      }

      text += `) VALUES ${pg.valuesArray(values)} RETURNING service_id`;

      if(!service.serviceProperties) {
        await pg.query(text, values);
        continue;
      }


      const client = await pg.getClient();

      try {
        await client.query('BEGIN');

        const serviceItem = await client.query(text, values);

        const serviceId = serviceItem.rows[0].service_id;
        let serviceRoleId = await this.getRoleId('public');

        const resRecord = { serviceId, service:[], serviceRoles: [], properties: [], propertyRoles: []};
        resRecord.service.push(serviceItem.rows[0]);

        if(service.role && service.role == "public") {
          const serviceRoleText = `
          INSERT INTO cork_status.service_role (service_id, role_id)
          VALUES ($1, $2)
          ON CONFLICT DO NOTHING
          RETURNING *
          `;

          const serviceRoleParams = [serviceId, serviceRoleId]//[employeeId, g.id];
          const r = await client.query(serviceRoleText, serviceRoleParams);
          resRecord.serviceRoles.push(r.rows[0]);

        }

        // Add Service Properties
        if (!service.serviceProperties) continue;
        const servicesProperties = Array.isArray(service.serviceProperties)
          ? service.serviceProperties
          : [service.serviceProperties];


        for (const sp of servicesProperties) {
          await this.ensureServiceProperty(sp.name);

          const servicePropertyId = await this.getServicePropertyId(sp.name);

          const serviceValuesText = `
          INSERT INTO cork_status.service_property_value (service_id, service_property_id, value, service_property_value_order)
          VALUES ($1, $2, $3, $4)
          RETURNING *
          `;

          const sp_r = [];
          const val = !Array.isArray(sp.value) ? [sp.value] : sp.value;


          // make sure all is individual
          for(const singleSP of val){
            const serviceValuesParams = [serviceId, servicePropertyId ,singleSP, sp.valueOrder ?? 0]//[employeeId, g.id];
            const sp_value = await client.query(serviceValuesText, serviceValuesParams);
            sp_r.push(sp_value.rows[0])
          }

 
          resRecord.properties.push(sp_r);


          if(sp.role && sp.role == "public") {
            let serviceRoleId = await this.getRoleId('public');
            const servicePropertiesRoleText = `
            INSERT INTO cork_status.service_property_role (service_property_id, role_id)
            VALUES ($1, $2)
            ON CONFLICT DO NOTHING
            RETURNING *
            `;

            const servicePropertiesRoleParams = [servicePropertyId, serviceRoleId]//[employeeId, g.id];
            const sprole_r = await client.query(servicePropertiesRoleText, servicePropertiesRoleParams);

            resRecord.propertyRoles.push(sprole_r.rows);

          }

        }
        out.res.push(resRecord);
        await client.query('COMMIT');

      } catch (e) {
        console.log('Error in creating a service', e);
        await client.query('ROLLBACK');
        out.err = true;
        out.error = e;
      } finally {
        client.release();
      }


    }


    return out;
    
  }

  /**
   * @method updateService
   * @description Updates a service's name, title, or tags based on its ID or name.
   * Also updates the `updated_by` field with the current user.
   * 
   * @param {String} nameorid - The service name or ID.
   * @param {Object} v - The update payload (name, title, tags, user).
   * @returns {Object} Result of the update query or error.
   */

  async updateService(nameorid, v={}){
    if ( !nameorid ) {
      return pg.returnError('id is required when updating service.');
    }

    let serviceId = await this.getServiceId(nameorid);
    let user = await this.ensureUser(v.user.username);

    const toUpdate = {};

    if(v.name) {
      toUpdate['name'] = v.name;
    }
    if(v.title) {
      toUpdate['title'] = v.title;
    }
    if(v.tags) {
      toUpdate['tags'] = v.tags;
    }

    if ( !Object.keys(toUpdate).length ){
      return pg.returnError('no valid fields to update');
    }

    toUpdate['updated_by'] = user;

    const updateClause = pg.toUpdateClause(toUpdate);
    const text = `
    UPDATE cork_status.service SET ${updateClause.sql}
    WHERE service_id = $${updateClause.values.length + 1}
    RETURNING service_id
    `;
    return await pg.query(text, [...updateClause.values, serviceId]);
  }

  /**
   * @method updateServicePropertyValues
   * @description Updates the value or value order of a service property value.
   * 
   * @param {String} nameorid - The property name or ID.
   * @param {Object} v - The update payload (value, valueOrder).
   * @returns {Object} Result of the update query or error.
   */

  async updateServicePropertyValues(nameorid, v={}){
    if ( !nameorid ) {
      return pg.returnError('id is required when updating service.');
    }

    let servicePropertyId = await this.getServicePropertyId(nameorid);

    const toUpdate = {};

    if(v.value) {
      toUpdate['value'] = v.value;
    }
    if(v.title) {
      toUpdate['service_property_value_order'] = v.valueOrder;
    }



    if ( !Object.keys(toUpdate).length ){
      return pg.returnError('no valid fields to update');
    }

    const updateClause = pg.toUpdateClause(toUpdate);
    const text = `
    UPDATE cork_status.service_property_value SET ${updateClause.sql}
    WHERE service_property_id = $${updateClause.values.length + 1}
    RETURNING service_property_value_id
    `;
    return await pg.query(text, [...updateClause.values, servicePropertyId]);
  }

  /**
   * @method updateServiceProperty
   * @description Updates a service property definition (name, title, type, description).
   * 
   * @param {String} nameorid - The service property name or ID.
   * @param {Object} v - The update payload with optional metadata fields.
   * @returns {Object} Result of the update query or error.
   */

  async updateServiceProperty(nameorid, v={}){
    if ( !nameorid ) {
      return pg.returnError('nameorid is required when updating service.');
    }

    let servicePropertyId = await this.getServicePropertyId(nameorid);
    let user = await this.ensureUser(v.user.username);

    const toUpdate = {};

    if(v.name) {
      toUpdate['name'] = v.name;
    }
    if(v.title) {
      toUpdate['title'] = v.title;
    }
    if(v.description) {
      toUpdate['description'] = v.description;
    }
    if(v.type) {
      toUpdate['type'] = v.type;
    }

    if ( !Object.keys(toUpdate).length ){
      return pg.returnError('no valid fields to update');
    }

    toUpdate['updated_by'] = user;

    const updateClause = pg.toUpdateClause(toUpdate);
    const text = `
    UPDATE cork_status.service_property SET ${updateClause.sql}
    WHERE service_property_id = $${updateClause.values.length + 1}
    RETURNING service_property_id
    `;
    return await pg.query(text, [...updateClause.values, servicePropertyId]);
  }

  /**
   * @method updateRoles
   * @description Updates the name of a role in the system.
   * 
   * @param {String} nameorid - The role name or ID.
   * @param {Object} v - The update payload containing the new role name.
   * @returns {Object} Result of the update query or error.
   */

  async updateRoles(nameorid, v={}){
    if ( !nameorid ) {
      return pg.returnError('nameorid is required when updating service.');
    }

    let roleId = await this.getRoleId(nameorid);
        
    const toUpdate = {};

    if(v.name) {
      toUpdate['name'] = v.name;
    }

    if ( !Object.keys(toUpdate).length ){
      return pg.returnError('no valid fields to update');
    }


    const updateClause = pg.toUpdateClause(toUpdate);
    const text = `
    UPDATE cork_status.role SET ${updateClause.sql}
    WHERE role_id = $${updateClause.values.length + 1}
    RETURNING role_id
    `;
    return await pg.query(text, [...updateClause.values, roleId]);  
  
  }

  /**
   * @method createProperties
   * @description Inserts a new service property definition.
   * 
   * @param {Object} data - Contains name, title, description, and type of the property.
   * @returns {Object} Query result or error.
   */

  async createProperties(data) {
    const params = [data.name, data.title, data.description, data.type];
    const text = `
      INSERT INTO cork_status.service_property (name, title, description, type)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT DO NOTHING
    `;
    return await pg.query(text, params);
  }

  /**
   * @method createRoles
   * @description Inserts a new role if it does not already exist.
   * 
   * @param {String} name - Name of the role to insert.
   * @returns {Object} Query result or error.
   */

  async createRoles(name){
    const params = [name];
    const text = `
      INSERT INTO cork_status.role (name)
      VALUES ($1)
      ON CONFLICT DO NOTHING
    `;
    return await pg.query(text, params);
  }


  /**
   * @method getServicePropertyId
   * @description Retrieves the UUID of a service property based on name or ID using a stored procedure.
   * 
   * @param {String} nameOrId - Name or ID of the service property.
   * @returns {String|Object} UUID string or error object.
   */
   async getServicePropertyId(nameOrId) {
    const client = await pg.getClient();

    try {
      const result = await client.query(
        'SELECT cork_status.get_service_property_id($1) AS service_property_id',
        [nameOrId]
      );
      return await result.rows[0].service_property_id;
    } catch (err) {
      return {error: true, err: err}
    } finally {
      client.release();
    }
  }

    /**
     * @method getServiceId
     * @description Retrieves the UUID of a service using a stored procedure.
     * 
     * @param {String} nameOrId - Name or ID of the service.
     * @returns {String|Object} UUID string or error object.
     */
    async getServiceId(nameOrId) {
      const client = await pg.getClient();

      try {
        const result = await client.query(
          'SELECT cork_status.get_service_id($1) AS service_id',
          [nameOrId]
        );
    
        return await result.rows[0].service_id;
      } catch (err) {
        return {error: true, err: err}
      } finally {
        client.release();
      }
    }

  /**
   * @method getUserId
   * @description Retrieves the UUID of a user using a stored procedure.
   * 
   * @param {String} nameIn - Username.
   * @returns {String|Object} UUID string or error object.
   */

  async getUserId(nameIn) {
    const client = await pg.getClient();

    try {
        const result = await client.query(
          'SELECT cork_status.get_user_id($1) AS get_user_id',
          [nameIn]
        );
    
        return await result.rows[0].get_user_id;
      } catch (err) {
        return {error: true, err: err}
      } finally {
        client.release();
      }
  }

  /**
   * @method ensureUser
   * @description Ensures a user exists by name and returns the user ID (calls PL/pgSQL function).
   * 
   * @param {String} username_in - Username to ensure/create.
   * @returns {String|Object} User UUID or error.
   */

  async ensureUser(username_in) {
    const client = await pg.pool.connect();

    try {
        const result = await client.query(
          'SELECT cork_status.ensure_user($1) AS ensure_user',
          [username_in]
        );
    
        return await result.rows[0].ensure_user
      } catch (err) {
        return {error: true, err: err}
      } finally {
        client.release();

      }
  }

  /**
   * @method ensureServiceProperty
   * @description Ensures a service property exists by name and returns its ID.
   * 
   * @param {String} name_in - Property name.
   * @returns {String|Object} Property UUID or error.
   */

  async ensureServiceProperty(name_in) {
    const client = await pg.getClient();

    try {
        const result = await client.query(
          'SELECT cork_status.ensure_service_property($1) AS ensure_property_id',
          [name_in]
        );
    
        // console.log(result.rows[0].ensure_property_id);
      } catch (err) {
        return {error: true, err: err}
      } finally {
        client.release();
      }
  }

  /**
   * @method getRoleId
   * @description Retrieves the ID of a role using a stored procedure.
   * 
   * @param {String} nameOrId - Role name or ID.
   * @returns {String|Object} Role UUID or error.
   */

  async getRoleId(nameOrId) {
    const client = await pg.getClient();

    try {
        const result = await client.query(
          'SELECT cork_status.get_role_id($1) AS role_id',
          [nameOrId]
        );
    
        return await result.rows[0].role_id;
      } catch (err) {
        return {error: true, err: err}
      } finally {
        client.release();
      }
  }


  /**
   * @method exampleQuery
   * @description Simple test method that runs a `SELECT NOW()` query in a transaction.
   * 
   * @returns {void}
   */
  async exampleQuery() {
    const client = await pg.getClient();

    try {
      await client.query('BEGIN');

      const res = await client.query('SELECT NOW()');
      console.log('Current time:', res.rows[0]);

      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      console.error('Query error:', e);
    } finally {
      client.release();
    }
  }

}

export default new Services();
