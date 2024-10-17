import asyncHandler from 'express-async-handler'

import { prisma } from '../prisma.js'

// @desc    Get news
// @route   GET /api/news
// @access  Private
export const getAllNews = asyncHandler(async (req, res) => {
	const { range, sort, filter } = req.query

	// Пример сортировки (если sort выглядит как ['createdAt', 'ASC'])
	const sortField = sort ? JSON.parse(sort)[0] : 'createdAt'
	const sortOrder = sort ? JSON.parse(sort)[1].toLowerCase() : 'desc' // Приводим к нижнему регистру для Prisma

	// Пример обработки диапазона для пагинации
	const rangeStart = range ? JSON.parse(range)[0] : 0
	const rangeEnd = range ? JSON.parse(range)[1] : 9

	// Получаем общее количество новостей
	const totalNews = await prisma.news.count()

	// Получаем новости с пагинацией
	const news = await prisma.news.findMany({
		skip: rangeStart,
		take: rangeEnd - rangeStart + 1, // количество записей для пагинации
		orderBy: {
			[sortField]: sortOrder // Используем переменные для поля и направления сортировки
		}
	})

	// Устанавливаем заголовок Content-Range
	res.set('Content-Range', `news ${rangeStart}-${rangeEnd}/${totalNews}`)
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

	// Извлекаем пути к файлам, если они передаются в виде объектов
	const imagePaths = images.map(image =>
		typeof image === 'object' ? `/uploads/${image.rawFile.path}` : image
	)

	const news = await prisma.news.create({
		data: {
			title,
			date,
			text,
			images: imagePaths
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
