const Joi = require('joi');
const CoreValidator = require('./CoreValidator');

class GroupInfoValidator extends CoreValidator {
  constructor() {
    const schema = {
      body: Joi.object({
        name: Joi.string().min(1).max(100).trim(),
        description: Joi.string().max(500).trim().allow(null, ''),
        image: Joi.string().trim().allow(null, ''),
      }),
    };
    super(schema);
  }
}

module.exports = new GroupInfoValidator();
