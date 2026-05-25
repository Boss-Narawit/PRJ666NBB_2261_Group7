const validateRegistration = (req, res, next) => {
  const { password } = req.body;

  // Check for missing or short passwords
  if (!password || password.length < 8) {
    return res.status(400).json({ 
      message: 'Password must be at least 8 characters long' 
    });
  }

  // Check for at least one letter, number, and special character
  const passwordRegex = /^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({ 
      message: 'Password must contain at least one letter, one number, and one special character' 
    });
  }

  next();
};

module.exports = {
  validateRegistration
};