const express = require('express');
const validate = require('../../middlewares/validate');
const auth = require('../../middlewares/auth');
const postController = require('../../controllers/post.controller');
const { albumValidation } = require('../../validations');


const router = express.Router();

router.post('/createPost', postController.createPost);
router.post('/admin/approvePost', postController.approvePost);
router.post('/admin/rejectPost', postController.rejectPost);
router.get('/getAllApprovePosts', postController.getAllApprovePosts);
router.get('/getAllUnApprovePosts', postController.getAllUnApprovePosts);
router.get('/getAllRejectPost', postController.getAllRejectPosts);




module.exports = router;
