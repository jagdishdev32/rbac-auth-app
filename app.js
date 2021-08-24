const express = require("express");
const createHttpError = require("http-errors");
const morgan = require("morgan");
const mongoose = require("mongoose");
require("dotenv").config();
const session = require("express-session");
const connectFlash = require("connect-flash");
const passport = require('passport');
const connectMongo = require('connect-mongo');
const connectEnsureLogin = require('connect-ensure-login')
const { roles } = require('./utils/constant')

// To store session in memory
const MongoStore = connectMongo(session);

// Initialization
const app = express();
app.use(morgan("dev"));
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Init Session
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      // secure: true,    // this mean cookie will work in https protocol , good for security
      httpOnly: true,
    },
    store: new MongoStore({ mongooseConnection: mongoose.connection})
  })
);

// For passport js authentication
app.use(passport.initialize());
app.use(passport.session());
require('./utils/passport.auth');

app.use((req, res, next) => {
  res.locals.user = req.user;
  next()
})

// Connect flash
app.use(connectFlash());
app.use((req, res, next) => {
  res.locals.messages = req.flash();
  next();
});

// Routes
app.use("/", require("./routes/index.route"));
app.use("/auth", require("./routes/auth.route"));
app.use("/user", connectEnsureLogin.ensureLoggedIn({ redirectTo: '/auth/login' }), require("./routes/user.route"));
app.use("/admin", connectEnsureLogin.ensureLoggedIn({redirectTo: '/users'}), ensureAdmin, require("./routes/admin.route"));


// Every other page
app.use((req, res, next) => {
  next(createHttpError.NotFound());
});

// Error handling
app.use((error, req, res, next) => {
  error.status = error.status || 500;
  res.status(error.status);
  res.render("error_40x", { error });
  // res.send(error);
});

// Connecting to mongoose and app listen
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = process.env.DB_NAME;

mongoose
  .connect(MONGO_URI, {
    dbName: DB_NAME,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useFindAndModify: false,
  })
  .then(() => {
    app.listen(PORT, () => console.log(`Running on port ${PORT}`));
    console.log("DB connected...");
  })
  .catch((error) => console.log(error.message));

  // function ensureAuthenticated(req, res, next) {
  //   if (req.isAuthenticated()) {
  //     next();
  //   } else {
  //     res.redirect('/auth/login')
  //   }
  // }

  function ensureAdmin(req, res, next) {
    if (req.user.role === roles.admin) {
      next();
    } else {
      req.flash('warning', 'you are not Authorized to see this route');
      res.redirect('/');
    }
  };

  function ensureModerator(req, res, next) {
    if (req.user.role === roles.moderator) {
      next();
    } else {
      req.flash('warning', 'you are not Authorized to see this route');
      res.redirect('/');
    }
  };