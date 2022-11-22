const Joi = require('joi');
const CoreValidator = require('./CoreValidator');
class UpdateUserValidator extends CoreValidator {
  constructor() {
    const schema = {
      body: Joi.object({
        email: Joi.string().email().lowercase().trim().required(),
        name: Joi.string().min(1).trim().required(),
        phone: Joi.string()
          .length(10)
          .pattern(/^[0-9]+$/)
          .required(),
        avatar: Joi.string().allow(null, ''),
      }),
    };
    super(schema);
  }
}

module.exports = new UpdateUserValidator();
