import express from 'express'

import { protect } from '../middleware/auth.middleware.js'

import {
	createNewGroup,
	deleteGroup,
	getGroup,
	getGroups,
	updateGroup
} from './group.controller.js'

const router = express.Router()

router.route('/').post(protect, createNewGroup).get(getGroups)

router
	.route('/:id')
	.get(getGroup)
	.put(protect, updateGroup)
	.delete(protect, deleteGroup)

export default router
