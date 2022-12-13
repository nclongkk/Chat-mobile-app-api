const Joi = require('joi');
const CoreValidator = require('./CoreValidator');
class MsgContent extends CoreValidator {
  constructor() {
    const schema = {
      body: Joi.object({
        content: Joi.string().trim().max(500).required(),
        type: Joi.string().valid('text', 'image', 'file').default('text'),
        fileName: Joi.string().trim().max(100),
      }),
    };
    super(schema);
  }
}

module.exports = new MsgContent();
