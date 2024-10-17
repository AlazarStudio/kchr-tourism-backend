import express from 'express'

import { protect } from '../middleware/auth.middleware.js'

import {
	createNewProject,
	deleteProject,
	getProject,
	getProjects,
	updateProject
} from './projects.controller.js'

const router = express.Router()

router.route('/').post(protect, createNewProject).get(getProjects)

router
	.route('/:id')
	.get(getProject)
	.put(protect, updateProject)
	.delete(protect, deleteProject)

export default router
