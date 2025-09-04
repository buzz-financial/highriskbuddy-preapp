const express = require("express");
const cors = require("cors");
const multer = require("multer");
const model = require("./model");
const session = require("express-session");

const app = express();
app.use(express.static("public"));
app.use(cors());

// MIDDLEWARES
function authorizeUser(req, res, next) {
  console.log("Current user session:", req.session);
  if (req.session && req.session.userId) {
    // user is authenticated
    model.User.findOne({
      _id: req.sessionn.userId,
    }).then(function (user) {
      if (user) {
        req.user = user;
        next();
      } else {
        // user is not authenticated: no matching user in the DB
        res.sendStatus(401);
      }
    });
  } else {
    // user is NOT authenticated
    res.sendStatus(401);
  }
}

// if using application/json Content-Type
app.use(express.json());

// if using application/x-www.form-urlencoded Content-Type:
app.use(express.urlencoded({ extended: false }));

app.use(
  session({
    secret: "jljmwurp49ut409tip4qjltrjhiegw4testrdytfug2kl34j24o5ut",
    saveUninitialized: true,
    resave: false,
  })
);

// if using multipart/form-data
// app.use(multer().none());

app.get("/veggies", authorizeUser, function (req, res) {
  model.Veggie.find({}).then((veggies) => {
    res.json(veggies);
  });
});

app.post("/veggies", authorizeUser, function (req, res) {
  console.log("Parsed request body: ", req.body);

  let newVeggie = new model.Veggie({
    name: req.body.name,
    color: req.body.color,
    rating: req.body.rating,
    user: req.user._id,
  });
  newVeggie
    .save()
    .then(() => {
      // The veggie was saved to the DB successfully!
      res.status(201).send("Created");
    })
    .catch((error) => {
      // validate client inputs
      if (error.errors) {
        // There are mongoose validation errors
        // make a simple JSON object to return to the client
        let errorMessages = {};
        for (let field in error.errors) {
          errorMessages[field] = error.errors[field].message;
        }
        res.status(422).json(errorMessages);
      } else if (error.code == 11000) {
        res.status(422).json({
          // database uniqueness violation
          email: "User with email already exists",
        });
      } else {
        // something bad happened...
        console.error("Failed to save veggie to DB", error);
        res.sendStatus(500);
      }
    });

  res.status(201).send("Created");
});

app.delete(`/veggies/:veggieId`, function (req, res) {
  // does the veggie even exist???
  model.Veggie.findOne({ _id: req.params.veggieId }).then(function (veggie) {
    // if it does exist:
    if (veggie) {
      // delete the veggie (mongoose things)
      model.Veggie.deleteOne({
        _id: req.params.veggieId,
      }).then(function () {
        // respond to the client: 200 OK or 204 No Content
        res.sendStatus(200);
      });
    } else {
      // respond to the client: 404 Not Found
      res.sendStatus(200);
    }
  });
});

// endpoint: create a user (i.e. register)
app.post(`/users`, function (req, res) {
  console.log("Parsed request body: ", req.body);

  let newUser = new model.User({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
  });

  // password
  newUser
    .setEncryptedPassword(req.body.plainPassword)
    .then(function () {
      // promise has been fulfilled
      newUser
        .save()
        .then(() => {
          // the user was saved to the DB successfully
          res.status(201).send("Created");
        })
        .catch((error) => {
          // validate client inputs
          if (error.errors) {
            // There are mongoose validation errors
            // make a simple JSON object to return to the client
            let errorMessages = {};
            for (let field in error.errors) {
              errorMessages[field] = error.errors[field].message;
            }
            res.status(422).json(errorMessages);
          } else if (error.code == 11000) {
            res.status(422).json({
              // database uniqueness violation
              email: "User with email already exists",
            });
          } else {
            // something bad happened...
            console.error("Failed to save User to DB", error);
            res.sendStatus(500);
          }
          // validate client inputs
          console.error("Failed to save user to DB", error);
        });
      res.status(201).send("Created");
    })
    .catch(function () {
      // promise could not be fulfilled
    });
});

app.get("/session", authorizeUser, function (req, res) {
  req.json(req.user);
});

// endpoint: authenticate a user (in a session)
app.post("/session", function (req, res) {
  // check if the user exists )(by email)
  model.User.findOne({
    email: req.body.email,
  }).then(function (user) {
    if (user) {
      // if user exists,  verify hashed password in DB matches given pw
      user.verifyEncryptedPassword(req.body.plainPassword).then(function (verified) {
        if (verified) {
          // if verified, record user into the session (authenticated)
          // TODO: save user to a session object!!!
          req.session.userId = user._id;
          res.sendStatus(201);
        } else {
          // if not verified, return status 401
          res.sendStatus(401);
        }
      });
    } else {
      // if user does not exist, return status 401
      res.sendStatus(401);
    }
  });
});

// endpoint: un-authenticate a user (log out)
app.delete("/session", authorizeUser, function (req, res) {
  req.session.userId = null;
  res.sendStatus(200);
});

app.listen(8080, function () {
  console.log("Server ready. Listening on port 8080");
});
