// Load required packages
var mongoose = require("mongoose");

// Define our user schema
var TaskSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: "" },
  deadline: { type: String, required: true },
  completed: { type: Boolean, default: false },
  assignedUser: { type: String, default: "" }, // The _id field of the user this task is assigned to - default ""
  assignedUserName: { type: String, default: "unassigned" }, // The name field of the user this task is assigned to - default "unassigned"
  dateCreated: { type: Date, default: Date.now } // should be set automatically by server to present date
});

// Export the Mongoose model
module.exports = mongoose.model("Task", TaskSchema);
