import asyncHandler from 'express-async-handler'

import { prisma } from '../prisma.js'

// @desc    Get groups
// @route   GET /api/groups
// @access  Private
export const getGroups = asyncHandler(async (req, res) => {
	const { range, sort, filter } = req.query

	const sortField = sort ? JSON.parse(sort)[0] : 'id'
	const sortOrder = sort ? JSON.parse(sort)[1].toLowerCase() : 'desc'

	const rangeStart = range ? JSON.parse(range)[0] : 0
	const rangeEnd = range ? JSON.parse(range)[1] : 9

	const totalGroups = await prisma.group.count()

	const groups = await prisma.group.findMany({
		skip: rangeStart,
		take: rangeEnd - rangeStart + 1,
		orderBy: {
			[sortField]: sortOrder
		}
	})
	
	res.set(
		'Content-Range',
		`groups ${rangeStart}-${rangeEnd}/${totalGroups}`
	)

	res.json(groups)
})

// @desc    Get group
// @route   GET /api/groups/:id
// @access  Private
export const getGroup = asyncHandler(async (req, res) => {
	const group = await prisma.group.findUnique({
		where: { id: +req.params.id }
	})

	if (!group) {
		res.status(404)
		throw new Error('Group not found!')
	}

	res.json({ ...group })
})

// @desc    Create new group
// @route 	POST /api/groups
// @access  Private
export const createNewGroup = asyncHandler(async (req, res) => {
	const { title } = req.body

	const group = await prisma.group.create({
		data: {
			title
		}
	})

	res.json(group)
})

// @desc    Update group
// @route 	PUT /api/groups/:id
// @access  Private
export const updateGroup = asyncHandler(async (req, res) => {
	const { title } = req.body

	try {
		const group = await prisma.group.update({
			where: {
				id: +req.params.id
			},
			data: {
				title
			}
		})

		res.json(group)
	} catch (error) {
		res.status(404)
		throw new Error('Group not found!')
	}
})

// @desc    Delete group
// @route 	DELETE /api/groups/:id
// @access  Private
export const deleteGroup = asyncHandler(async (req, res) => {
	try {
		const group = await prisma.group.delete({
			where: {
				id: +req.params.id
			}
		})

		res.json({ message: 'Group deleted!' })
	} catch (error) {
		res.status(404)
		throw new Error('Group not found!')
	}
})
