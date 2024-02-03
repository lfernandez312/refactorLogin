const { Router } = require('express')
const authMiddleware = require('../middlewares/auth.middlewares')
const publicAccess = require('../middlewares/public-acces.middleware')


const router = Router()

router.get('/login', (req, res) => {
  res.render('login.handlebars', {estilo: 'login.css' })
})

router.get('/signup',publicAccess, (req, res) => {
  res.render('signup.handlebars', {estilo: 'login.css' })
})

router.get('/profile', authMiddleware, (req, res) => {
  const { user } = req.session
  const isAdmin = user && user.role === 'admin';
  res.render('profile.handlebars', { user , estilo: 'login.css', isAdmin})
})

router.get('/forgotPassword', (req, res) => {
  res.render('forgot-password.handlebars', {estilo: 'login.css' })
})

module.exports = router