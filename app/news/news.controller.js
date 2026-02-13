import asyncHandler from 'express-async-handler'

import { prisma } from '../prisma.js'

// @desc    Get news
// @route   GET /api/news
// @access  Private
export const getAllNews = asyncHandler(async (req, res) => {
	const { range, sort, filter } = req.query

	const sortField = sort ? JSON.parse(sort)[0] : 'date'
	const sortOrder = sort ? JSON.parse(sort)[1].toLowerCase() : 'desc'
	const rangeStart = range ? JSON.parse(range)[0] : 0
	const rangeEnd = range ? JSON.parse(range)[1] : 9

	const parsedFilter = filter ? JSON.parse(filter) : {}
	const where = {}

	if (parsedFilter?.type) {
		where.type = parsedFilter.type
	}

	const totalNews = await prisma.news.count({ where })
	const news = await prisma.news.findMany({
		skip: rangeStart,
		take: rangeEnd - rangeStart + 1,
		orderBy: { [sortField]: sortOrder },
	where
	})

	res.set('Content-Range', `news ${rangeStart}-${rangeEnd}/${totalNews}`)
	res.json(news)
});

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
	const { type, title, date, text, images, videos } = req.body

	// Извлекаем пути к файлам, если они передаются в виде объектов
	const imagePaths = (images || []).map(image =>
		typeof image === 'object' ? `/uploads/${image.rawFile.path}` : image
	)
	const videoPaths = (videos || []).map(video =>
		typeof video === 'object' ? `/uploads/${video.rawFile.path}` : video
	)

	const news = await prisma.news.create({
		data: {
			type,
			title,
			date,
			text,
			images: imagePaths,
			videos: videoPaths
		}
	})

	res.json(news)
})

// @desc    Create new news via GET parameters
// @route   GET /api/news/create
// @access  Private
export const createNewNewsWithParams = asyncHandler(async (req, res) => {
	const { title, date, text, images } = req.query

	if (!title || !date || !text || !images) {
		res.status(400)
		throw new Error('Missing required fields')
	}

	// Проверяем, существует ли новость с таким же заголовком и датой
	const existingNews = await prisma.news.findFirst({
		where: {
			title: title,
			date: date
		}
	})

	if (existingNews) {
		res.status(400)
		throw new Error('News with this title and date already exists')
	}

	// Преобразуем строку с изображениями в массив (если изображения передаются в формате JSON-строки)
	const imagePaths = JSON.parse(images)

	const news = await prisma.news.create({
		data: {
			title,
			date,
			text,
			images: imagePaths,
			videos: []
		}
	})

	res.json(news)
})

// @desc    Update news
// @route 	PUT /api/news/:id
// @access  Private
export const updateNews = asyncHandler(async (req, res) => {
	const { type, title, date, text, images, videos } = req.body

	try {
		const news = await prisma.news.update({
			where: {
				id: +req.params.id
			},
			data: {
				type,
				title,
				date,
				text,
				images: images || [],
				videos: videos || []
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
