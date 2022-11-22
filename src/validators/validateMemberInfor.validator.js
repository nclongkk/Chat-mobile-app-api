const Joi = require('joi');
const CoreValidator = require('./CoreValidator');
class MemberInfoValidator extends CoreValidator {
  constructor() {
    const schema = {
      body: Joi.object({
        nickName: Joi.string().max(50).trim().allow(null, ''),
        notify: Joi.boolean().allow(null),
      }),
    };
    super(schema);
  }
}

module.exports = new MemberInfoValidator();
