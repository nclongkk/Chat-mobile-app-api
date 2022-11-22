const Joi = require('joi');
const CoreValidator = require('./CoreValidator');
class RegisterValidator extends CoreValidator {
  constructor() {
    const schema = {
      body: Joi.object({
        email: Joi.string().email().lowercase().trim().required(),
        password: Joi.string().min(4).required(),
        name: Joi.string().min(1).trim().required(),
      }),
    };
    super(schema);
  }
}

module.exports = new RegisterValidator();
