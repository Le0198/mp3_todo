var secrets = require("../config/secrets");

module.exports = function(router) {
  var homeRoute = router.route("/");

  homeRoute.get(function(req, res) {
    var connectionString = secrets.token;
    res.json({ message: "My connection string is " + connectionString });
  });

  return router;
};

/**
 * https://mongoosejs.com/docs/schematypes.html
 */
