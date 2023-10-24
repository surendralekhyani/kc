const createError = require('http-errors');
const express = require('express');
const path = require('path'); // https://nodejs.dev/en/learn/nodejs-file-paths/
const flash = require('express-flash'); // Flash Messages for your Express Application
const session = require('express-session'); // for session
const loginRouter = require('./routes/login');
const usersRouter = require('./routes/users');

const app = express();

// app.get('/', (req, res) => {
//     res.send("Yo!, This is home page" + " Current Directory is: " + __dirname);
//   });


// view engine setup
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'ejs');
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    app.use(express.static(path.join(__dirname, 'public')));// ab public menssion nahi karna 

// Session Setting 
    app.use(session({ 
        cookie: { maxAge: 60000 },
        store: new session.MemoryStore,
        saveUninitialized: true,
        resave: 'true',
        secret: 'secret'
    }))

app.use(flash());

    function authMiddleware(req, res, next)
    {
        let headres = req.headres;
        console.log(req.method);
        if(req.session.user)
        {
            console.log(req.session.user.id);
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
    // app.use('/dashboard', dashboardRouter);
    app.get('/dashboard', authMiddleware , function(req, res, next) {  
        const nm = req.session.user;
        res.render('dashboard',{'nm': nm});  
    });

// catch 404 and forward to error handler (http-errors package)
app.use(function(req, res, next) {
  next(createError(404, 'Page not found... This is generated from server.js due to http-errors package'));
});



app.listen(3420, ()=>{
    console.log("Server running at http://localhost:3420/");
  });
