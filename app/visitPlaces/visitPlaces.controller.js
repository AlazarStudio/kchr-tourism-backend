import asyncHandler from 'express-async-handler'

import { prisma } from '../prisma.js'

// @desc    Get visitPlaces
// @route   GET /api/visitPlaces
// @access  Private
export const getAllVisitPlaces = asyncHandler(async (req, res) => {
	const { range, sort, filter } = req.query

	const sortField = sort ? JSON.parse(sort)[0] : 'createdAt'
	const sortOrder = sort ? JSON.parse(sort)[1].toLowerCase() : 'desc'

	const rangeStart = range ? JSON.parse(range)[0] : 0
	const rangeEnd = range ? JSON.parse(range)[1] : 9

	const totalVisitPlaces = await prisma.visitPlaces.count()

	const visitPlaces = await prisma.visitPlaces.findMany({
		skip: rangeStart,
		take: rangeEnd - rangeStart + 1,
		orderBy: {
			[sortField]: sortOrder
		}
	})

	res.set(
		'Content-Range',
		`visitPlaces ${rangeStart}-${rangeEnd}/${totalVisitPlaces}`
	)
	res.json(visitPlaces)
})

// @desc    Get visitPlaces
// @route   GET /api/visitPlaces/:id
// @access  Private
export const getVisitPlaces = asyncHandler(async (req, res) => {
	const visitPlaces = await prisma.visitPlaces.findUnique({
		where: { id: +req.params.id }
	})

	if (!visitPlaces) {
		res.status(404)
		throw new Error('VisitPlaces not found!')
	}

	res.json({ ...visitPlaces })
})

// @desc    Create new visitPlaces
// @route 	POST /api/visitPlaces
// @access  Private
export const createNewVisitPlaces = asyncHandler(async (req, res) => {
	const { title, date, text, images } = req.body

	const imagePaths = images.map(image =>
		typeof image === 'object' ? `/uploads/${image.rawFile.path}` : image
	)

	const visitPlaces = await prisma.visitPlaces.create({
		data: {
			title,
			date,
			text,
			images: imagePaths
		}
	})

	res.json(visitPlaces)
})

// @desc    Update visitPlaces
// @route 	PUT /api/visitPlaces/:id
// @access  Private
export const updateVisitPlaces = asyncHandler(async (req, res) => {
	const { title, date, text, images } = req.body

	try {
		const visitPlaces = await prisma.visitPlaces.update({
			where: {
				id: +req.params.id
			},
			data: { title, date, text, images }
		})

		res.json(visitPlaces)
	} catch (error) {
		res.status(404)
		throw new Error('VisitPlaces not found!')
	}
})

// @desc    Delete VisitPlaces
// @route 	DELETE /api/visitPlaces/:id
// @access  Private
export const deleteVisitPlaces = asyncHandler(async (req, res) => {
	try {
		const visitPlaces = await prisma.visitPlaces.delete({
			where: {
				id: +req.params.id
			}
		})

		res.json({ message: 'VisitPlaces deleted!' })
	} catch (error) {
		res.status(404)
		throw new Error('VisitPlaces not found!')
	}
})
