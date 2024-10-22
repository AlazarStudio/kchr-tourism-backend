import express from 'express'

import { protect } from '../middleware/auth.middleware.js'

import {
	createNewStories,
	createStoriesTelegram,
	deleteStories,
	getAllStories,
	getStories,
	updateStories
} from './stories.controller.js'

const router = express.Router()

router.route('/').post(protect, createNewStories).get(getAllStories)

router.route('/create').get(createStoriesTelegram)

router
	.route('/:id')
	.get(getStories)
	.put(protect, updateStories)
	.delete(protect, deleteStories)

export default router
