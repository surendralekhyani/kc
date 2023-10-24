const express = require("express");
const router = express.Router();
const dbConn = require("../lib/db");
const bcrypt = require("bcrypt");

// display user page
router.get("/", function (req, res, next) {
  dbConn.query("SELECT * FROM users ORDER BY id desc", function (err, rows) {
    if (err) {
      req.flash("error", err);
      // render to views/users/index.ejs
      res.render("users", { data: "" });
    } else {
      // render to views/users/index.ejs
      req.session.mynm = "Suri";
      req.session.save();
      const nm = req.session.mynm;
      res.render("users", { data: rows, nm });
    }
  });
});

// display add user page
router.get("/add", function (req, res, next) {
  // render to add.ejs
  res.render("users/add", {
    name: "dddd",
    email: "abc@gmail.com",
    password: "12345",
    confirmPassword: "12345",
  });
});

function checkEmail(email) {
  return new Promise((resolve, reject) => {
    const sql = "SELECT email FROM users WHERE email = ?";
    dbConn.query(sql, [email], (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results.length > 0);
      }
    });
  });
}

// add a new user
router.post("/add", function (req, res, next) {
  let name = req.body.name;
  let email = req.body.email;
  let password = req.body.password;
  let confirmPassword = req.body.confirmPassword;
  let errors = false;
  let emailRegex =
    /^[-!#$%&'*+\/0-9=?A-Z^_a-z{|}~](\.?[-!#$%&'*+\/0-9=?A-Z^_a-z`{|}~])*@[a-zA-Z0-9](-*\.?[a-zA-Z0-9])*\.[a-zA-Z](-?[a-zA-Z0-9])+$/;

  checkEmail(email).then((exists) => {
    if (exists) {
      // Email exist
      errors = true;
      req.flash("error", "EMAIL already exists...");
      req.flash("error", "....!!!");
      res.render("users/add", {
        name: name,
        email: email,
        password: password,
        confirmPassword: confirmPassword,
      });
    } // Email does not exist
    else {
      if (
        name.length === 0 ||
        email.length === 0 ||
        password === 0 ||
        name.length > 100 ||
        email.length > 100
      ) {
        errors = true;
        req.flash(
          "error",
          "Please enter name and email and password OR limit acceeded."
        );
      } else if (!emailRegex.test(email)) {
        errors = true;
        req.flash("error", "Invalid Email Address.");
      } else if (password.length < 5 || password.length > 20) {
        errors = true;
        req.flash("error", "Required Min. Password length is 5");
      } else if (password != confirmPassword) {
        errors = true;
        req.flash("error", "Password and Confirm Password r not same.");
      }

      // render to add.ejs with flash message
      if (errors) {
        req.flash("error", "....!!!");
        res.render("users/add", {
          name: name,
          email: email,
          password: password,
          confirmPassword: confirmPassword,
        });
      }

      // if no error
      if (!errors) {
        const saltRounds = 10;
        bcrypt
          .hash(password, saltRounds)
          .then((hash) => {
            var form_data = {
              fullname: name,
              email: email,
              password: hash,
            };

            // insert query
            dbConn.query(
              "INSERT INTO users SET ?",
              form_data,
              function (err, result) {
                if (err) {
                  req.flash("error", err);
                  res.render("users/add", {
                    name: form_data.name,
                    email: form_data.email,
                    password: form_data.password,
                  });
                } else {
                  req.flash("success", "User successfully added");
                  res.redirect("/");
                }
              }
            ); // query finished
          }) // then close
          .catch((err) => console.error(err.message));
      } // End if(!errors)
    }
  });

  console.log("End of this post");
}); //post end

// display edit user page
router.get("/edit/(:id)", function (req, res, next) {
  let id = req.params.id;

  dbConn.query(
    "SELECT * FROM users WHERE id = " + id,
    function (err, rows, fields) {
      if (err) throw err;

      // if user not found
      if (rows.length <= 0) {
        req.flash("error", "User not found with id = " + id);
        res.redirect("/users");
      }
      // if user found
      else {
        // render to edit.ejs
        res.render("users/edit", {
          title: "Edit User",
          id: rows[0].id,
          name: rows[0].name,
          email: rows[0].email,
          position: rows[0].position,
        });
      }
    }
  );
});

// update user data
router.post("/update/:id", function (req, res, next) {
  let id = req.params.id;
  let name = req.body.name;
  let email = req.body.email;
  let position = req.body.position;
  let errors = false;

  if (name.length === 0 || email.length === 0 || position.length === 0) {
    errors = true;

    // set flash message
    req.flash("error", "Please enter name and email and position");
    // render to add.ejs with flash message
    res.render("users/edit", {
      id: req.params.id,
      name: name,
      email: email,
      position: position,
    });
  }

  // if no error
  if (!errors) {
    var form_data = {
      name: name,
      email: email,
      position: position,
    };
    // update query
    dbConn.query(
      "UPDATE users SET ? WHERE id = " + id,
      form_data,
      function (err, result) {
        //if(err) throw err
        if (err) {
          // set flash message
          req.flash("error", err);
          // render to edit.ejs
          res.render("users/edit", {
            id: req.params.id,
            name: form_data.name,
            email: form_data.email,
            position: form_data.position,
          });
        } else {
          req.flash("success", "User successfully updated");
          res.redirect("/users");
        }
      }
    );
  }
});

// delete user
router.get("/delete/(:id)", function (req, res, next) {
  let id = req.params.id;

  dbConn.query("DELETE FROM users WHERE id = " + id, function (err, result) {
    //if(err) throw err
    if (err) {
      // set flash message
      req.flash("error", err);
      // redirect to user page
      res.redirect("/users");
    } else {
      // set flash message
      req.flash("success", "User successfully deleted! ID = " + id);
      // redirect to user page
      res.redirect("/users");
    }
  });
});

module.exports = router;
