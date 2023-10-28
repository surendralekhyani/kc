const express = require("express");
const { check, validationResult } = require('express-validator');
const router = express.Router();
const dbConn = require("../lib/db");
const bcrypt = require("bcrypt");


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

let validateInputs = [
  check("name", "Name can not be blank...").trim().notEmpty().escape(),

  check("email", "Invalid email").trim().isEmail(),

  check("password", "Invalid password. Password must be at least 5 chars long")
    .isLength({ min: 5 }),

  check("confirmPassword", "Password confirmation does not match password")
    .custom((value, { req }) => {
      return value === req.body.password
    })
];


let checkExistEmail = (email) => {
  return new Promise((resolve, reject) => {
    try {
      dbConn.query(
        ' SELECT * FROM `users` WHERE `email` = ?  ', email,
        function (err, rows) {
          if (err) {
            reject(err)
          }
          if (rows.length > 0) {
            resolve(true)
          } else {
            resolve(false)
          }
        }
      );
    } catch (err) {
      reject(err);
    }
  });
};

let createNewUser = (data) => {
  return new Promise(async (resolve, reject) => {
    // check email is exist or not
    let isEmailExist = await checkExistEmail(data.email);
    if (isEmailExist) {
      reject(`This email "${data.email}" has already exist. Please choose an other email`);
    } else {
      // hash password
      let salt = bcrypt.genSaltSync(10);
      let userItem = {
        fullname: data.fullname,
        email: data.email,
        password: bcrypt.hashSync(data.password, salt),
      };

      //create a new account
      dbConn.query(
        ' INSERT INTO users set ? ', userItem,
        function (err, rows) {
          if (err) {
            reject(false)
          }
          resolve("Create a new user successful");
        }
      );
    }
  });
};


// add a new user
router.post("/add", validateInputs, async function (req, res, next) {
  //validate required fields
  let errorsArr = [];
  let validationErrors = validationResult(req);
  if (!validationErrors.isEmpty()) {
    let errors = Object.values(validationErrors.mapped());
    errors.forEach((item) => {
      errorsArr.push(item.msg);
    });
    req.flash("error", errorsArr);
    return res.render("users/add", {
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      confirmPassword: req.body.confirmPassword,
    });
  }

  //create a new user
  let newUser = {
    fullname: req.body.name,
    email: req.body.email,
    password: req.body.password
  };
  try {
    await createNewUser(newUser);
    req.flash("success", "User successfully added");
    return res.redirect("/");
  } catch (err) {
    req.flash("error", err);
    res.render("users/add", {
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      confirmPassword: req.body.confirmPassword,
    });
  }
});


module.exports = router;
