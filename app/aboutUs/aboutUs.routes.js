import express from 'express'

import { protect } from '../middleware/auth.middleware.js'

import {
	createAboutUs,
	deleteAboutUs,
	getAboutUs,
	getAllAboutUs,
	updateAboutUs
} from './aboutUs.controller.js'

const router = express.Router()

router.route('/').post(protect, createAboutUs).get(getAllAboutUs)

router
	.route('/:id')
	.get(getAboutUs)
	.put(protect, updateAboutUs)
	.delete(protect, deleteAboutUs)

export default router
