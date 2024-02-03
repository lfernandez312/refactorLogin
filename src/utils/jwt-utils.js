const jwt = require('jsonwebtoken');

const PRIVATE_KEY = 'cualquiercosa'

const generateToken = user => {
    const token = jwt.sign({user}, PRIVATE_KEY, { expiresIn: '12hs'})
    return token
}

//const authToken = 

module.exports = {
    generateToken,
    //authToken,
}