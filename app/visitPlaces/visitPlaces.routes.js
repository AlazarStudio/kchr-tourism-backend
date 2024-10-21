import express from 'express'

import { protect } from '../middleware/auth.middleware.js'

import {
	createNewVisitPlaces,
	deleteVisitPlaces,
	getAllVisitPlaces,
	getVisitPlaces,
	updateVisitPlaces
} from './visitPlaces.controller.js'

const router = express.Router()

router.route('/').post(protect, createNewVisitPlaces).get(getAllVisitPlaces)

router
	.route('/:id')
	.get(getVisitPlaces)
	.put(protect, updateVisitPlaces)
	.delete(protect, deleteVisitPlaces)

export default router
