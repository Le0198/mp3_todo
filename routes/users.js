var UserModel = require("../models/user.js");
var TaskModel = require("../models/task.js");
var mongoose = require("mongoose");

module.exports = function(router) {
  var usersRoute = router.route("/users");
  var userRoute = router.route("/users/:id");

  usersRoute.get(function(req, res) {
    let filtering = !req.query.where ? {} : JSON.parse(req.query.where);
    let sorting = !req.query.sort ? {} : JSON.parse(req.query.sort);
    let selection = !req.query.select ? {} : JSON.parse(req.query.select);
    let maxNumOfEl = parseInt(req.query.limit);
    let numElToSkip = parseInt(req.query.skip);
    let shouldCount = parseInt(req.query.count);
    UserModel.find(filtering)
      .sort(sorting)
      .skip(numElToSkip)
      .limit(maxNumOfEl)
      .select(selection)
      .exec(function(err, user) {
        if (err) {
          res.status(500).send({
            message: "Error 500: Server Error",
            data: err
          });
        } else if (shouldCount) {
          res.status(200).send({
            message: "OK",
            data: user.length
          });
        } else {
          res.status(200).send({
            message: "OK",
            data: user
          });
        }
      });
  });

  usersRoute.post(async function(req, res) {
    let pendingTasksSet = new Set(req.body.pendingTasks);
    for (let v of pendingTasksSet) {
      if (mongoose.Types.ObjectId.isValid(v)) {
        await TaskModel.findById(v, (err, task) => {
          if (!task || task.completed) {
            pendingTasksSet.delete(v);
          }
        }).catch(err => {
          pendingTasksSet.delete(v);
        });
      } else {
        pendingTasksSet.delete(v);
      }
    }
    req.body.pendingTasks = Array.from(pendingTasksSet);

    let newUser = new UserModel(req.body);
    await newUser
      .save()
      .catch(err => {
        res.status(500).send({
          message: "Error 500: Server Error",
          data: err
        });
      })
      .then(() => {
        res.status(201).send({
          message: "OK",
          data: newUser
        });
      });
  });

  userRoute.get(async function(req, res) {
    await UserModel.findById(req.params.id, function(err, user) {
      if (!user) {
        res.status(404).send({
          message: "Error 404: ID not found",
          data: null
        });
      } else {
        res.status(200).send({
          message: "OK",
          data: user
        });
      }
    }).catch(err => {
      res.status(500).send({
        message: "Error 500: Server Error",
        data: err
      });
    });
  });

  userRoute.put(function(req, res) {
    UserModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
      function(err, user) {
        if (err) {
          res.status(500).send({
            message: "Error 500: Server Error",
            data: err
          });
        } else if (!user) {
          res.status(404).send({
            message: "Error 404: ID not found",
            data: null
          });
        } else {
          res.status(200).send({
            message: "OK",
            data: user
          });
        }
      }
    );
  });

  userRoute.delete(function(req, res) {
    UserModel.findByIdAndDelete(req.params.id, function(err, user) {
      if (!user) {
        res.status(404).send({
          message: "Error 404: ID not found",
          data: null
        });
      } else {
        for (let v of user.pendingTasks) {
          TaskModel.findByIdAndUpdate(
            v,
            { $set: { assignedUser: "", assignedUserName: "unassigned" } },
            (err, task) => {}
          );
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
