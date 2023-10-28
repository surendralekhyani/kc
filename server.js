const createError = require('http-errors');
const express = require('express');
const path = require('path'); // https://nodejs.dev/en/learn/nodejs-file-paths/
const flash = require('express-flash'); // Flash Messages for your Express Application
const session = require('express-session'); // for session
const loginRouter = require('./routes/login');
const usersRouter = require('./routes/users');
const itemsRouter = require('./routes/items');
const { error } = require('console');
const dbConn = require("./lib/db");

const app = express();

// app.get('/', (req, res) => {
//     res.send("Yo!, This is home page" + " Current Directory is: " + __dirname);
//   });


// view engine setup
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'ejs');
    app.use(express.json()); // client se aane wale JSON data ko req.body ki form m le aata h.. ( eg. req.body.email )
    app.use(express.urlencoded({ extended: false }));
    app.use(express.static(path.join(__dirname, 'public')));// ab public menssion nahi karna 

// Session Setting 
    app.use(session({ 
        cookie: { maxAge: 86400000 },
        store: new session.MemoryStore,
        saveUninitialized: true,
        resave: 'true',
        secret: 'secretSuriStar'
    }))

app.use(flash());

function authMiddleware(req, res, next)
{
    let headres = req.headres;
    // console.log(req.method);
    if(req.session.user)
    {
        // console.log(req.session.user.id);
        next();
    }
    else{
        req.flash('error', 'Unauthorised access...');
        res.redirect('/');
    }
    
}

// app.use(authMiddleware);

// Setting Routers
    app.use('/', loginRouter);
    app.use('/users', usersRouter);
    app.use('/items', itemsRouter);
    // app.use('/dashboard', dashboardRouter);

    app.get('/dashboard', authMiddleware, function(req, res, next) { 
        dbConn.query("SELECT userrowid,menuoption FROM userrights ORDER BY userrowid", function (err, rows) {
            if (err) {
                req.flash("error", err);
                res.render('dashboard');  
            } else {
                const nm = req.session.user;
                res.render("dashboard", { 'records': rows, 'userName': nm.fullname }); // records goes in Object form from here
            }
          }); 
    });

// catch 404 and forward to error handler (http-errors package)
app.use(function(req, res, next) {
  next(createError(404, 'server says: Page not found...'));
});



app.listen(3420, ()=>{
    console.log("Server running at http://localhost:3420");
  });
