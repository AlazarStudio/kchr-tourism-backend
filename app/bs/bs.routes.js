import express from 'express'

import { protect } from '../middleware/auth.middleware.js'

import {
	createNewBS,
	deleteBS,
	getAllBS,
	getBS,
	updateBS
} from './bs.controller.js'

const router = express.Router()

router.route('/').post(protect, createNewBS).get(getAllBS)

router.route('/:id').get(getBS).put(protect, updateBS).delete(protect, deleteBS)

export default router
