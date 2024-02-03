const { Router } = require('express')
const passport = require('passport')
const Users = require('../models/users.model');
const router = Router()

router.post(
  '/',
  passport.authenticate('register', {
    failureRedirect: '/users/fail-register',
  }),(req, res) => {
    try {
      res
        .status(201)
        .json({ status: 'success', message: 'User has been register' })
    } catch (error) {
      console.log(error)
      res.status(500).json({ status: 'error', error: 'Internal Server Error' })
    }
  }
)

router.get('/api', async (req, res) => {
  if(req.user.role==='admin'){
    try {
      const users = await Users.find();

      res.json({
        status: 'success',
        payload: users,
      });
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      res.status(500).json({ error: 'Error del servidor al obtener usuarios' });
    }
  } else {
    res.status(400).json({ error: 'NO ESTAS AUTORIZADO' });
  }
});

router.get('/fail-register', (req, res) => {
  console.log('falló registro')
  res.status(400).json({ status: 'error', error: 'Bad Request'})
})

module.exports = router