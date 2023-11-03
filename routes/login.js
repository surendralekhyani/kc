const express = require('express');
const router = express.Router();
const dbConn  = require('../lib/db');
const bcrypt = require("bcrypt")
 
// display login page
router.get('/', function(req, res, next) {    
    res.render('login',{data: 'temp'});  
});

router.post("/login", (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    dbConn.query("SELECT * FROM users WHERE deleted='N' AND email = ?", [email], async (error, results) => 
    {
        if (error) 
        {
          // throw error;
          req.flash('error', error);
          res.redirect('/');
        }
        if (results.length === 0) 
        {
          // The user does not exist
          req.flash('error', 'Invalid Credentials (user)...');
          res.redirect('/');
        } 
        else 
        {
          try
          {
            const user = results[0];
            const match = await bcrypt.compare(password, user.password);
            if(match) {
              req.session.user = user;
              req.session.save();
              res.redirect('../dashboard');
            }
            else {
              req.flash('error', 'Invalid Credentials...');
              res.redirect('/');
            }
          }
          catch(err){
            req.flash('error', err);
            res.redirect('/');
          }
          
          ////// This Commented code also works fine (With .then())
          // const user = results[0];
          // bcrypt.compare(password, user.password).then(function(result) 
          // {
          //   if(result)
          //   {
          //     res.redirect('/dashboard');
          //   }
          //   else
          //   {
          //     req.flash('error', 'Invalid Credentials...');
          //     res.redirect('/');
          //   }
          // }).catch(function(err)
          // { 
          //   req.flash('error', err);
          //   res.redirect('/'); 
          // });  
          ////// END - This Commented code also works fine (With .then())



        }
    }); //query ends here
  });
    
  // function noCacheOnLogout(req, res, next)
  // {
  //   res.setHeader("Cache-Control", "no-store, no-cache");
  //   next();
  // }
  router.get('/logout', function(req, res) {    
    req.session.destroy(function(err) {
      return res.redirect("/");
  });
});
 
// display home/dashboard page
// router.get('/dashboard', function(req, res, next) {    
//     res.render('dashboard');  
// });



module.exports = router;