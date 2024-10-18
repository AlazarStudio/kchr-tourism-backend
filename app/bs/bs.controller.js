import asyncHandler from 'express-async-handler'

import { prisma } from '../prisma.js'

// @desc    Get bs
// @route   GET /api/bs
// @access  Private
export const getAllBS = asyncHandler(async (req, res) => {
	const { range, sort, filter } = req.query

	const sortField = sort ? JSON.parse(sort)[0] : 'createdAt'
	const sortOrder = sort ? JSON.parse(sort)[1].toLowerCase() : 'desc'

	const rangeStart = range ? JSON.parse(range)[0] : 0
	const rangeEnd = range ? JSON.parse(range)[1] : 9

	const totalBS = await prisma.bS.count()

	const bs = await prisma.bS.findMany({
		skip: rangeStart,
		take: rangeEnd - rangeStart + 1,
		orderBy: {
			[sortField]: sortOrder
		}
	})

	res.set('Content-Range', `bs ${rangeStart}-${rangeEnd}/${totalBS}`)
	res.json(bs)
})

// @desc    Get bs
// @route   GET /api/bs/:id
// @access  Private
export const getBS = asyncHandler(async (req, res) => {
	const bs = await prisma.bS.findUnique({
		where: { id: +req.params.id }
	})

	if (!bs) {
		res.status(404)
		throw new Error('BS not found!')
	}

	res.json({ ...bs })
})

// @desc    Create new bs
// @route 	POST /api/bs
// @access  Private
export const createNewBS = asyncHandler(async (req, res) => {
	const { type, title, date, text, images } = req.body

	const imagePaths = images.map(image =>
		typeof image === 'object' ? `/uploads/${image.rawFile.path}` : image
	)

	const bs = await prisma.bS.create({
		data: {
			type,
			title,
			date,
			text,
			images: imagePaths
		}
	})

	res.json(bs)
})

// @desc    Update bs
// @route 	PUT /api/bs/:id
// @access  Private
export const updateBS = asyncHandler(async (req, res) => {
	const { type, title, date, text, images } = req.body

	try {
		const bs = await prisma.bS.update({
			where: {
				id: +req.params.id
			},
			data: { type, title, date, text, images }
		})

		res.json(bs)
	} catch (error) {
		res.status(404)
		throw new Error('BS not found!')
	}
})

// @desc    Delete BS
// @route 	DELETE /api/bs/:id
// @access  Private
export const deleteBS = asyncHandler(async (req, res) => {
	try {
		const bs = await prisma.bS.delete({
			where: {
				id: +req.params.id
			}
		})

		res.json({ message: 'BS deleted!' })
	} catch (error) {
		res.status(404)
		throw new Error('BS not found!')
	}
})
