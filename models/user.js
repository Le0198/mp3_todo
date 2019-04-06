// Load required packages
var mongoose = require("mongoose");
var uniqueValidator = require("mongoose-unique-validator");

// Define our user schema
var UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  pendingTasks: { type: [String], default: [] }, // The _id fields of the pending tasks that this user has
  dateCreated: { type: Date, default: Date.now } // Should be set automatically by server
});

UserSchema.plugin(uniqueValidator, { message: "email is already taken!" });
// Export the Mongoose model
module.exports = mongoose.model("User", UserSchema);
