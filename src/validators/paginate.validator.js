const Joi = require('joi');
const CoreValidator = require('./CoreValidator');
class PaginateValidator extends CoreValidator {
  constructor() {
    const schema = {
      query: Joi.object({
        page: Joi.number().integer().default(1),
        limit: Joi.number().integer().default(5),
      }),
    };
    super(schema);
  }
}

module.exports = new PaginateValidator();
