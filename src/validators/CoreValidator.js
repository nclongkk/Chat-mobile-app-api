const httpStatus = require('http-status');
const customError = require('../utils/customError');

module.exports = class CoreValidator {
  constructor(schema) {
    this.schema = schema;
  }
  validate() {
    return async (req, res, next) => {
      try {
        for (const [key, schema] of Object.entries(this.schema)) {
          const data = await schema.validateAsync(req[key]);
          req[key] = data;
        }
        return next();
      } catch (error) {
        return next(new customError(error.message, httpStatus.BAD_REQUEST));
      }
    };
  }
};
