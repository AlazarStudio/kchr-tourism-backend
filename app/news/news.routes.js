import express from 'express'

import { protect } from '../middleware/auth.middleware.js'

import {
	createNewNews,
	deleteNews,
	getAllNews,
	getNews,
	updateNews
} from './news.controller.js'

const router = express.Router()

router.route('/').post(protect, createNewNews).get(getAllNews)

router
	.route('/:id')
	.get(getNews)
	.put(protect, updateNews)
	.delete(protect, deleteNews)

export default router
