exports.sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();
  const options = {
    httpOnly: true,
  };
  return res
    .status(statusCode)
    .cookie('token', token, options)
    .json({ success: true, token });
};

exports.response = (result, statusCode, res) => {
  if (!res) {
    // return for socket handler
    return result;
  }
  return res.status(statusCode).json({ result });
};
