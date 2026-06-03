const validateAuthentication = (req, res, next) => {
  // Check if body exist before proceeding
  if (!req.body) {
    return res.status(400).json({ message: 'Request body is missing' });
  }

  const { email, password } = req.body;

  // Check if email is valid
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  // Check for missing or short passwords
  if (!password || password.length < 8) {
    return res.status(400).json({
      message: 'Password must be at least 8 characters long',
    });
  }

  // BR2: at least one letter and one number
  const passwordRegex = /^(?=.*[a-zA-Z])(?=.*[0-9])/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      message: 'Password must contain at least one letter and one number',
    });
  }

  next();
};

module.exports = {
  validateAuthentication,
};
