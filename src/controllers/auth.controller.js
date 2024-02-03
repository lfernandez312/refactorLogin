const { Router } = require('express');
const passport = require('passport');
const Users = require('../models/users.model')
const { createHash } = require('../utils/utils')

const router = Router();

router.post('/',
passport.authenticate('login', {failureRedirect: '/auth/fail-login'}),
async (req, res) => {
  try{
    const userInfo = {
      first_name: req.user.first_name,
      last_name: req.user.last_name,
      email: req.user.email,
      role: req.user.role,
    };
    req.session.user = userInfo;

    // Almacenar la información del usuario en la sesión
    res.status(200).json({ ...userInfo, redirect: '/profile' });
  } catch(error) {
      console.error(error);
      res.status(500).json({status:'error', message: 'Error interno del servidor' });
  }
});

router.get('/fail-login', (req, res) => {
  console.log('falló Login')
  res.status(400).json({ status: 'error', error: 'Bad Request'})
})

router.post('/forgotpassword', async (req, res) => {
  try {
    const { email, password } = req.body
    console.log('🚀 ~ router.get ~ body:', req.body)

    const passwordEncrypted = createHash(password)

    await Users.updateOne({ email }, { password: passwordEncrypted })

    res.status(200).json({ status: 'sucess', message: 'Password updated' })
  } catch (error) {
    console.log(error)
    res.status(500).json({ status: 'error', error: 'Internal Server Error' })
  }
})

router.get('/github',passport.authenticate('github', {scope: ['user:email']},(req,res) => {}))

router.get('/githubcallback',passport.authenticate('github', {failureRedirect: '/login'}),(req, res) => {
  req.session.user = req.user
  res.redirect('/')
})

module.exports = router;
