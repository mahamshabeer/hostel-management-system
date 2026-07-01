module.exports = function (roleRequired) {
  return (req, res, next) => {

    const role = req.headers.role;

    if (!role) {
      return res.status(401).json({
        message: "No role found"
      });
    }

    if (role !== roleRequired) {
      return res.status(403).json({
        message: `Only ${roleRequired} can perform this action`
      });
    }

    next();
  };
};