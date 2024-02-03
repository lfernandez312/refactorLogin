const passport = require('passport');
const local = require('passport-local');
const Users = require('../models/users.model');
const GitHubStrategy = require('passport-github2');
const { createHash, isValidPassword } = require('../utils/utils');
const { ghclientId, ghclientSecret, PORT, URL } = require('./security');

const localStrategy = local.Strategy;

const initializePassport = () => {
  passport.use(
    'register',
    new localStrategy(
      { passReqToCallback: true, usernameField: 'email' },
      async (req, username, password, done) => {
        try {
          const { first_name, last_name, email } = req.body
          const user = await Users.findOne({ email: username })
          if (user) {
            console.log('User exists')
            return done(null, false)
          }

          const newUserInfo = {
            first_name,
            last_name,
            email,
            password: createHash(password),
          }

          const newUser = await Users.create(newUserInfo)

          return done(null, newUser)
        } catch (error) {
          return done(error)
        }
      }
    )
  )

  passport.use('login',
    new localStrategy(
      { usernameField: 'email' },
      async (username, password, done) => {
        try {
          const user = await Users.findOne({ email: username });

          if (!user) {
            console.log('Usuario No existe')
            return done(null, false);
          }

          if (!isValidPassword(user, password)) {
            console.log('No hay Match')
            return done(null, false);
          }
          return done(null, user)
        } catch (error) {
          done(error)
        }
      }
    )
  )

  passport.use('github',
    new GitHubStrategy(
      {
        clientID: ghclientId,
        clientSecret: ghclientSecret,
        callbackURL: `http://${URL}:${PORT}/auth/githubcallback`

      },
      async (accessToken, RefreshToken, profile, done) => {
        try {
          console.log(profile)
          const { id, login, name, email } = profile._json

          // Separo el nombre completo en first_name y last_name
          const [first_name, last_name] = name.split(' ');
          const user = await Users.findOne({ email: email });

          if (!user) {
            const UserGithubInfo = {
              first_name: first_name,
              last_name: last_name,
              email,
              githubId: id,
              githubUsername: login,
            };

            const newUserGithub = await Users.create(UserGithubInfo);
            return done(null, newUserGithub)
          }
          return done(null, user)
        } catch (error) {
          done(error)
        }
      })
  )

  passport.serializeUser((user, done) => {
    console.log(user);
    done(null, user._id);
  })

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await Users.findById(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  })
}

module.exports = initializePassport;