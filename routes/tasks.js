var TaskModel = require("../models/task.js");
var UserModel = require("../models/user.js");
var mongoose = require("mongoose");

module.exports = function(router) {
  var tasksRoute = router.route("/tasks");
  var taskRoute = router.route("/tasks/:id");

  tasksRoute.get(function(req, res) {
    let filtering = !req.query.where ? {} : JSON.parse(req.query.where);
    let sorting = !req.query.sort ? {} : JSON.parse(req.query.sort);
    let selection = !req.query.select ? {} : JSON.parse(req.query.select);
    let maxNumOfEl = parseInt(req.query.limit);
    let numElToSkip = parseInt(req.query.skip);
    let shouldCount = parseInt(req.query.count);
    TaskModel.find(filtering)
      .sort(sorting)
      .skip(numElToSkip)
      .limit(maxNumOfEl)
      .select(selection)
      .exec(function(err, task) {
        if (err) {
          res.status(500).send({
            message: "Error 500: Server Error",
            data: err
          });
        } else if (shouldCount) {
          res.status(200).send({
            message: "OK",
            data: task.length
          });
        } else {
          res.status(200).send({
            message: "OK",
            data: task
          });
        }
      });
  });

  tasksRoute.post(async function(req, res) {
    if (
      req.body.assignedUser &&
      mongoose.Types.ObjectId.isValid(req.body.assignedUser)
    ) {
      await UserModel.findById(req.body.assignedUser, (err, user) => {
        if (user) {
          req.body.assignedUserName = user.name;
        } else {
          req.body.assignedUser = "";
          req.body.assignedUserName = "unassigned";
        }
      });
    } else {
      req.body.assignedUser = "";
      req.body.assignedUserName = "unassigned";
    }
    let newTask = new TaskModel(req.body);
    await newTask.save((err, task) => {
      if (err) {
        res.status(500).send({
          message: "Error 500: Server Error",
          data: err
        });
      } else {
        res.status(201).send({
          message: "OK",
          data: task
        });
      }
    });
  });

  taskRoute.get(async function(req, res) {
    await TaskModel.findById(req.params.id, function(err, task) {
      if (!task) {
        res.status(404).send({
          message: "Error 404: ID not found",
          data: null
        });
      } else {
        res.status(200).send({
          message: "OK",
          data: task
        });
      }
    }).catch(err => {
      res.status(500).send({
        message: "Error 500: Server Error",
        data: err
      });
    });
  });

  taskRoute.put(async function(req, res) {
    if (req.body.assignedUser) {
      if (mongoose.Types.ObjectId.isValid(req.body.assignedUser)) {
        await UserModel.findById(req.body.assignedUser, (err, user) => {
          if (user) {
            req.body.assignedUserName = user.name;
          } else {
            req.body.assignedUser = "";
            req.body.assignedUserName = "unassigned";
          }
        });
      } else {
        req.body.assignedUser = "";
        req.body.assignedUserName = "unassigned";
      }
    }

    await TaskModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
      function(err, task) {
        if (!task) {
          res.status(404).send({
            message: "Error 404: ID not found",
            data: null
          });
        } else {
          res.status(200).send({
            message: "OK",
            data: task
          });
        }
      }
    ).catch(err => {
      res.status(500).send({
        message: "Error 500: Server Error",
        data: err
      });
    });
  });

  taskRoute.delete(function(req, res) {
    TaskModel.findByIdAndRemove(req.params.id, function(err, task) {
      if (!task) {
        res.status(404).send({
          message: "Error 404: ID not found",
          data: null
        });
      } else {
        if (task.assignedUser) {
          if (mongoose.Types.ObjectId.isValid(task.assignedUser)) {
            UserModel.findByIdAndUpdate(
              task.assignedUser,
              { $pullAll: { pendingTasks: [task._id] } },
              function(err, user) {}
            );
          }
        }
        res.status(200).send({
          message: "OK",
          data: []
        });
      }
    }).catch(err => {
      res.status(500).send({
        message: "Error 500: Server Error",
        data: err
      });
    });
  });

  return router;
};
