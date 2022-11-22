const Joi = require('joi');
const CoreValidator = require('./CoreValidator');
class MsgContent extends CoreValidator {
  constructor() {
    const schema = {
      body: Joi.object({
        content: Joi.string().trim().max(500).required(),
      }),
    };
    super(schema);
  }
}

module.exports = new MsgContent();
