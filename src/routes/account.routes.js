const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const accountController = require('../controllers/account.controller');


const router = express.Router();


/*
* POST /api/accounts/create
* - Creates a new account
* - Requires authentication
*/

router.post('/create', authMiddleware.verifyToken, accountController.createAccount);


module.exports = router;