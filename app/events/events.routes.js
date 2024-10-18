import express from 'express'

import { protect } from '../middleware/auth.middleware.js'

import {
	createEvent,
	deleteEvent,
	getEvent,
	getEvents,
	updateEvent
} from './events.controller.js'

const router = express.Router()

router.route('/').post(protect, createEvent).get(getEvents)

router
	.route('/:id')
	.get(getEvent)
	.put(protect, updateEvent)
	.delete(protect, deleteEvent)

export default router
