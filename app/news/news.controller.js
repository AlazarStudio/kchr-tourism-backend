import asyncHandler from 'express-async-handler'

import { prisma } from '../prisma.js'


// @desc    Get news
// @route   GET /api/news
// @access  Private
export const getAllNews = asyncHandler(async (req, res) => {
	const news = await prisma.news.findMany({
		orderBy: {
			createdAt: 'desc'
		}
	})
	res.json(news)
})


// @desc    Get news
// @route   GET /api/news/:id
// @access  Private
export const getNews = asyncHandler(async (req, res) => {
	const news = await prisma.news.findUnique({
		where: { id: +req.params.id }
	})

	if (!news) {
		res.status(404)
		throw new Error('News not found!')
	}

	res.json({ ...news })
})


// @desc    Create new news
// @route 	POST /api/news
// @access  Private
export const createNewNews = asyncHandler(async (req, res) => {
	const { title, date, text, images } = req.body

	const news = await prisma.news.create({
		data: {
			title,
			date,
			text,
			images
		}
	})

	res.json(news)
})


// @desc    Update news
// @route 	PUT /api/news/:id
// @access  Private
export const updateNews = asyncHandler(async (req, res) => {
	const { title, date, text, images } = req.body

	try {
		const news = await prisma.news.update({
			where: {
				id: +req.params.id
			},
			data: {
				title,
				date,
				text,
				images
			}
		})

		res.json(news)
	} catch (error) {
		res.status(404)
		throw new Error('News not found!')
	}
})


// @desc    Delete news
// @route 	DELETE /api/news/:id
// @access  Private
export const deleteNews = asyncHandler(async (req, res) => {
	try {
		const news = await prisma.news.delete({
			where: {
				id: +req.params.id
			}
		})

		res.json({ message: 'News deleted!' })
	} catch (error) {
		res.status(404)
		throw new Error('News not found!')
	}
})
