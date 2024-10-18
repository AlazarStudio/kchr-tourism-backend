import asyncHandler from 'express-async-handler'

import { prisma } from '../prisma.js'

// @desc    Get aboutUs
// @route   GET /api/aboutUs
// @access  Private
export const getAllAboutUs = asyncHandler(async (req, res) => {
	const { range, sort, filter } = req.query

	const sortField = sort ? JSON.parse(sort)[0] : 'createdAt'
	const sortOrder = sort ? JSON.parse(sort)[1].toLowerCase() : 'desc'

	const rangeStart = range ? JSON.parse(range)[0] : 0
	const rangeEnd = range ? JSON.parse(range)[1] : 9

	const totalAboutUs = await prisma.aboutUs.count()

	const aboutUs = await prisma.aboutUs.findMany({
		skip: rangeStart,
		take: rangeEnd - rangeStart + 1,
		orderBy: {
			[sortField]: sortOrder
		}
	})

	res.set('Content-Range', `aboutUs ${rangeStart}-${rangeEnd}/${totalAboutUs}`)
	res.json(aboutUs)
})

// @desc    Get aboutUs
// @route   GET /api/aboutUs/:id
// @access  Private
export const getAboutUs = asyncHandler(async (req, res) => {
	const aboutUs = await prisma.aboutUs.findUnique({
		where: { id: +req.params.id }
	})

	if (!aboutUs) {
		res.status(404)
		throw new Error('AboutUs not found!')
	}

	res.json({ ...aboutUs })
})

// @desc    Create new aboutUs
// @route 	POST /api/aboutUs
// @access  Private
export const createAboutUs = asyncHandler(async (req, res) => {
	const { title, date, text, images } = req.body

	const imagePaths = images.map(image =>
		typeof image === 'object' ? `/uploads/${image.rawFile.path}` : image
	)

	await prisma.aboutUs.deleteMany()

	const aboutUs = await prisma.aboutUs.create({
		data: {
			title,
			date,
			text,
			images: imagePaths
		}
	})

	res.json(aboutUs)
})

// @desc    Update aboutUs
// @route 	PUT /api/aboutUs/:id
// @access  Private
export const updateAboutUs = asyncHandler(async (req, res) => {
	const { title, date, text, images } = req.body

	try {
		const aboutUs = await prisma.aboutUs.update({
			where: {
				id: +req.params.id
			},
			data: { title, date, text, images }
		})

		res.json(aboutUs)
	} catch (error) {
		res.status(404)
		throw new Error('AboutUs not found!')
	}
})

// @desc    Delete AboutUs
// @route 	DELETE /api/aboutUs/:id
// @access  Private
export const deleteAboutUs = asyncHandler(async (req, res) => {
	try {
		const aboutUs = await prisma.aboutUs.delete({
			where: {
				id: +req.params.id
			}
		})

		res.json({ message: 'AboutUs deleted!' })
	} catch (error) {
		res.status(404)
		throw new Error('AboutUs not found!')
	}
})
