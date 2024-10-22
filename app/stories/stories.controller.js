import asyncHandler from 'express-async-handler'

import { prisma } from '../prisma.js'

// @desc    Get stories
// @route   GET /api/stories
// @access  Private
export const getAllStories = asyncHandler(async (req, res) => {
	const { range, sort, filter } = req.query

	const sortField = sort ? JSON.parse(sort)[0] : 'createdAt'
	const sortOrder = sort ? JSON.parse(sort)[1].toLowerCase() : 'desc'

	const rangeStart = range ? JSON.parse(range)[0] : 0
	const rangeEnd = range ? JSON.parse(range)[1] : 9

	const totalStories = await prisma.stories.count()

	const stories = await prisma.stories.findMany({
		skip: rangeStart,
		take: rangeEnd - rangeStart + 1,
		orderBy: {
			[sortField]: sortOrder
		}
	})

	res.set('Content-Range', `stories ${rangeStart}-${rangeEnd}/${totalStories}`)
	res.json(stories)
})

// @desc    Get stories
// @route   GET /api/stories/:id
// @access  Private
export const getStories = asyncHandler(async (req, res) => {
	const stories = await prisma.stories.findUnique({
		where: { id: +req.params.id }
	})

	if (!stories) {
		res.status(404)
		throw new Error('Stories not found!')
	}

	res.json({ ...stories })
})

// @desc    Create new stories
// @route 	POST /api/stories
// @access  Private
export const createNewStories = asyncHandler(async (req, res) => {
	const { title, date, text, images } = req.body

	const imagePaths = images.map(image =>
		typeof image === 'object' ? `/uploads/${image.rawFile.path}` : image
	)

	const stories = await prisma.stories.create({
		data: {
			title,
			date,
			text,
			images: imagePaths
		}
	})

	res.json(stories)
})

// @desc    Create new stories via GET parameters
// @route 	POST /api/stories
// @access  Private
export const createStoriesTelegram = asyncHandler(async (req, res) => {
	const { title, date, text, images } = req.query

	if (!title || !date || !text || !images) {
		res.status(400)
		throw new Error('Missing required fields')
	}

	const existingStories = await prisma.stories.findFirst({
		where: {
			title: title
		}
	})

	if (existingStories) {
		res.status(400)
		throw new Error('News with this title and date already exists')
	}

	const imagePaths = JSON.parse(images)

	const stories = await prisma.stories.create({
		data: {
			title,
			date,
			text,
			images: imagePaths
		}
	})

	res.json(stories)
})

// @desc    Update stories
// @route 	PUT /api/stories/:id
// @access  Private
export const updateStories = asyncHandler(async (req, res) => {
	const { title, date, text, images } = req.body

	try {
		const stories = await prisma.stories.update({
			where: {
				id: +req.params.id
			},
			data: { title, date, text, images }
		})

		res.json(stories)
	} catch (error) {
		res.status(404)
		throw new Error('Stories not found!')
	}
})

// @desc    Delete Stories
// @route 	DELETE /api/stories/:id
// @access  Private
export const deleteStories = asyncHandler(async (req, res) => {
	try {
		const stories = await prisma.stories.delete({
			where: {
				id: +req.params.id
			}
		})

		res.json({ message: 'Stories deleted!' })
	} catch (error) {
		res.status(404)
		throw new Error('Stories not found!')
	}
})
