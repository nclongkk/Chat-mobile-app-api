const bcrypt = require('bcryptjs');
const util = require('util');

exports.encrypt = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

exports.isMatch = async (strNeedtoCompare, encryptedStr) => {
  let check = util.promisify(bcrypt.compare);
  return check(strNeedtoCompare, encryptedStr);
};
