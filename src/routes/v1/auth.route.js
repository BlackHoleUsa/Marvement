const express = require('express');
const validate = require('../../middlewares/validate');
const authValidation = require('../../validations/auth.validation');
const authController = require('../../controllers/auth.controller');
const auth = require('../../middlewares/auth');

const router = express.Router();
/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register as user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userName
 *               - email
 *               - address
 *               - role
 *             properties:
 *               userName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *                 description: must be unique
 *               address:
 *                 type: string
 *               role:
 *                 type: string
 *             example:
 *               userName: rana1
 *               email: arthur2@yopmail.com
 *               address: '0x145D80bbdD65299cb24377C4233Fd946Bb6308f6'
 *               role: artist
 *     responses:
 *       "201":
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 tokens:
 *                   $ref: '#/components/schemas/AuthTokens'
 *       "400":
 *         $ref: '#/components/responses/DuplicateEmail'
 */

router.post('/register', authController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - address
 *             properties:
 *               address:
 *                 type: string
 *             example:
 *               address: '0x9F2eFE7C38732BFb37Cd33b8C54B57cE0551fdF2'
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 tokens:
 *                   $ref: '#/components/schemas/AuthTokens'
 *       "401":
 *         description: Invalid email or password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               code: 401
 *               message: Invalid email or password
 */
router.post('/login', validate(authValidation.login), authController.login);
/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *             example:
 *               refreshToken: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2MTM3MTVmN2E1ZThjODAwMTZkMDU0YTciLCJpYXQiOjE2MzEwMDU4MzUsInR5cGUiOiJhY2Nlc3MifQ.XNZnsqaJQZBPoGaQ6BexF0fcIn7vL7cBTuD1elOv65A
 *     responses:
 *       "204":
 *         description: No content
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */

router.post('/logout', auth(['logout']), authController.logout);

// /**
//  * @swagger
//  * /auth/forgot-password:
//  *   post:
//  *     summary: Forgot password
//  *     description: An email will be sent to reset password.
//  *     tags: [Auth]
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required:
//  *               - email
//  *               - code
//  *             properties:
//  *               email:
//  *                 type: string
//  *                 format: email
//  *               code:
//  *                 type: string
//  *             example:
//  *               email: fake@example.com
//  *               code: '2350'
//  *     responses:
//  *       "204":
//  *         description: No content
//  *       "404":
//  *         $ref: '#/components/responses/NotFound'
//  */
// router.post('/forgot-password', validate(authValidation.forgotPassword), authController.forgotPassword);
// /**
//  * @swagger
//  * /auth/reset-password:
//  *   post:
//  *     summary: Reset password
//  *     tags: [Auth]
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required:
//  *               - email
//  *               - password
//  *             properties:
//  *               email:
//  *                 type: string
//  *                 format: email
//  *               password:
//  *                 type: string
//  *                 format: password
//  *                 minLength: 8
//  *                 description: At least one number and one letter
//  *             example:
//  *               email: fake@email.com
//  *               password: password1
//  *     responses:
//  *       "204":
//  *         description: No content
//  *       "401":
//  *         description: Password reset failed
//  *         content:
//  *           application/json:
//  *             schema:
//  *               $ref: '#/components/schemas/Error'
//  *             example:
//  *               code: 401
//  *               message: Password reset failed
//  */

// router.post('/reset-password', validate(authValidation.resetPassword), authController.resetPassword);

// /**
//  * @swagger
//  * /auth/verify-email:
//  *   post:
//  *     summary: verify email
//  *     tags: [Auth]
//  *     parameters:
//  *       - in: query
//  *         name: token
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: The verify email token
//  *     responses:
//  *       "204":
//  *         description: No content
//  *       "401":
//  *         description: verify email failed
//  *         content:
//  *           application/json:
//  *             schema:
//  *               $ref: '#/components/schemas/Error'
//  *             example:
//  *               code: 401
//  *               message: verify email failed
//  */

// router.post('/verify-email', validate(authValidation.verifyEmail), authController.verifyEmail);

module.exports = router;
