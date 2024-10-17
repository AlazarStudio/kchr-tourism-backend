import asyncHandler from 'express-async-handler'

import { prisma } from '../prisma.js'
import { UserFields } from '../utils/user.utils.js'

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = asyncHandler(async (req, res) => {
	const user = await prisma.user.findUnique({
		where: {
			id: req.user.id
		},
		select: UserFields
	})

	res.json(user)
})

// @desc    Get users with pagination
// @route   GET /api/users
// @access  Private
export const getUsers = asyncHandler(async (req, res) => {
	// Получаем параметры range для пагинации
	const range = req.query.range ? JSON.parse(req.query.range) : [0, 9]
	const start = range[0]
	const end = range[1]

	// Получаем общее количество пользователей
	const totalUsers = await prisma.user.count()

	// Получаем пользователей с ограничением по количеству (пагинация)
	const users = await prisma.user.findMany({
		skip: start, // Начало диапазона
		take: end - start + 1, // Количество записей
		select: UserFields // Поля, которые нужно вернуть
	})

	// Устанавливаем заголовок Content-Range
	res.setHeader('Content-Range', `users ${start}-${end}/${totalUsers}`)
	res.setHeader('Access-Control-Expose-Headers', 'Content-Range')

	// Возвращаем данные пользователей
	res.json(users)
})
