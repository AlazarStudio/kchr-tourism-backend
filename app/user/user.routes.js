import express from 'express'

import { protect } from '../middleware/auth.middleware.js'

import { getUserProfile, getUsers } from './user.controller.js'

const router = express.Router()

router.route('/profile').get(protect, getUserProfile)
router.route('/users').get(protect, getUsers)

export default router
