var request = require('request');
var crypto = require('crypto');
var bcrypt = require('bcrypt-nodejs');
var util = require('../lib/utility');
var Promise = require('bluebird');

var db = require('../app/config');
var User = require('../app/models/user');
var Link = require('../app/models/link');
var Users = require('../app/collections/users');
var Links = require('../app/collections/links');

exports.renderIndex = function(req, res) {
  res.render('index');
};

exports.signupUserForm = function(req, res) {
  res.render('signup');
};

exports.loginUserForm = function(req, res) {
  res.render('login');
};

exports.logoutUser = function(req, res) {
  req.session.destroy(function() {
    res.redirect('/login');
  });
};

exports.fetchLinks = function(req, res) {
  Link.find({}, function(err, urls) {
    if (err) {
      console.log(err);
    }
    res.send(200, urls);
  });
};

var shortenUrl = function(linkModel) {
  var shasum = crypto.createHash('sha1');
  shasum.update(linkModel.url);
  linkModel.code = shasum.digest('hex').slice(0, 5);
};

exports.saveLink = function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  Link.find({ url: uri }, function(err, urls) {
    if (err) { console.log(err); }
    if (urls.length) {
      res.send(200, urls[0]);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }
        var newLink = new Link({
          url: uri,
          title: title,
          base_url: req.headers.origin
        });
        shortenUrl(newLink);
        newLink.save(function(err) {
          if (err) { console.log(err); }
          res.send(200, newLink);
        });
      });
    }
  });
};

var hashPassword = function(user, callback){
  var cipher = Promise.promisify(bcrypt.hash);
  return cipher(user.password, null, null).bind(user)
    .then(function(hash) {
      this.password = hash;
      callback(this);
    });
};

var comparePassword = function(attemptedPassword, dbPassword, callback) {
  bcrypt.compare(attemptedPassword, dbPassword, function(err, isMatch) {
    if (err) { 
      console.log(err); 
      console.log(attemptedPassword);
      console.log(dbPassword);
    }
    console.log('ismatch',isMatch);
    callback(isMatch);
  });
};

exports.loginUser = function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  User.find({ username: username }, function(err, users) {
    console.log('USERS LEN',users.length);
    if (users.length === 0) {
      res.redirect('/login');
    } else {
      var user = users[0];
      comparePassword(password, user.password, function(match) {
        console.log('password match:',match);
        if (match) {
          util.createSession(req, res, user);
        } else {
          res.redirect('/login');
        }
      })
    }
  });
};

exports.signupUser = function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  //var myUser = new User({ username: username });
  User.find({username:username}, function(err, user) {
    if (err) { console.log(err); }
    else {
      if (user.length === 0) {
        var newUser = new User({
          username: username,
          password: password
        });
        hashPassword(newUser, function(hashedUser) {
          hashedUser.save(function(err, savedUser) {
            console.log('SAVING USER',savedUser);
            util.createSession(req, res, savedUser);
          });
        });
      } else {
        console.log('Account already exists');
        res.redirect('/signup');
      }
    }
  });
};

exports.navToLink = function(req, res) {
  //console.log('req params 0', req.params[0]);
  // these are get requests for either favicon (hah) or a shortened url code
  Link.find({ code: req.params[0] }, function(err, links) {
    if (err) {
      console.log(err);
    }
    else {
      console.log('link len',links.length)
      if (links.length === 0) {
        res.redirect('/');
      } else {
        links[0].visits++;
        links[0].save(function(err, link) {
          if (err) {
            console.log(err);
          }
          res.redirect(link.url);
        })
      }
    }
  });
};