const Joi = require('joi');
const CoreValidator = require('./CoreValidator');
class LoginValidator extends CoreValidator {
  constructor() {
    const schema = {
      body: Joi.object({
        email: Joi.string().email().lowercase().trim().required(),
        password: Joi.string().min(5).required(),
      }),
    };
    super(schema);
  }
}

module.exports = new LoginValidator();
