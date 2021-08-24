const router = require("express").Router();
const User = require("../models/user.model");
const { body, validationResult } = require("express-validator");
const passport = require("passport")
const connectEnsureLogin = require('connect-ensure-login');  // replacing ensure nto authenticated to redirect if redrected from other url
const { registorValidator } = require("../utils/validator");

router.get("/login", connectEnsureLogin.ensureLoggedOut({ redirectTo: '/'}), async (req, res, next) => {
  res.render("login");
});


router.post("/login", passport.authenticate('local', {
  // successRedirect: "/",
  successReturnToOrRedirect: '/',
  failureRedirect: "/auth/login",
  failureFlash: true,
  
}));

router.get("/register", connectEnsureLogin.ensureLoggedOut({ redirectTo: '/'}), async (req, res, next) => {
  // res.render('register');
  // req.flash('error', "some error")
  // req.flash('error', "some error2")
  // req.flash('info', "some value")
  // req.flash('warning', "some value")
  // req.flash('success', "some value")

  // const messages = req.flash();
  // res.redirect('/auth/login')
  // console.log(messages)
  // console.log(messages)
  // res.render('register', {messages: messages})
  res.render("register");
});

router.post(
  "/register", connectEnsureLogin.ensureLoggedOut({ redirectTo: '/'}),
  registorValidator
  ,
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        // console.log(errors)
        // return;
          errors.array().forEach(error => {
          req.flash('error', error.msg)
        })
        res.render('register', { email: req.body.email, messages: req.flash()})
        return;
      }
      
      const { email } = req.body;
      const doesExist = await User.findOne({ email });

      if (doesExist) {
        req.flash('error', 'User already exists')
        res.render("register", { messages: req.flash()});
        return;
      }

      const user = new User(req.body);
      await user.save();
      console.log('user created')
      // Creating Flash message if account created
      req.flash('success', `${user.email} registered succesfully, you can now login`)
      res.redirect('/auth/login')
      // console.log(error)
      // res.send(user);
    } catch (error) {
      next(error);
    }
  }
);

router.get("/logout", connectEnsureLogin.ensureLoggedIn({ redirectTo: '/'}), async (req, res, next) => {
  // res.send("Logout");
  req.logOut();
  res.redirect('/')
});

module.exports = router;

// function ensureAuthenticated(req, res, next) {
//   if (req.isAuthenticated()) {
//     next();
//   } else {
//     res.redirect('/auth/login')
//   }
// }

// function ensureNotAuthenticated(req, res, next) {
//   if (req.isAuthenticated()) {
//     res.redirect('/')
//   } else {
//     next();
//   }
// }

// function ensureAdmin(req, res, next) {
//   if (req.user.role === roles.admin) {
//     next();
//   } else {
//     req.flash('warning', 'you are not Authorized to see this route');
//     res.redirect('/');
//   }
// };