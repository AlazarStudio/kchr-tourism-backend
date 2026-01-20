import { Prisma } from '@prisma/client'
import asyncHandler from 'express-async-handler'

import { prisma } from '../prisma.js'

// @desc    Get events
// @route   GET /api/events
// @access  Private
export const getEvents = asyncHandler(async (req, res) => {
	const { range, sort, filter } = req.query

	const sortField = sort ? JSON.parse(sort)[0] : 'createdAt'
	const sortOrder = sort ? JSON.parse(sort)[1].toLowerCase() : 'desc'

	const rangeStart = range ? JSON.parse(range)[0] : 0
	const rangeEnd = range ? JSON.parse(range)[1] : 9

	const parsedFilter = filter ? JSON.parse(filter) : {}
	const where = {}
	const month = parsedFilter?.month ? Number(parsedFilter.month) : null

	if (parsedFilter?.city) {
		where.city = parsedFilter.city
	}

	if (parsedFilter?.isCurrent !== undefined) {
		const isCurrent =
			typeof parsedFilter.isCurrent === 'string'
				? parsedFilter.isCurrent === 'true'
				: Boolean(parsedFilter.isCurrent)
		where.isCurrent = isCurrent
	}

	if (month && month >= 1 && month <= 12) {
		const conditions = [Prisma.sql`EXTRACT(MONTH FROM "date") = ${month}`]

		if (parsedFilter?.city) {
			conditions.push(Prisma.sql`"city" = ${parsedFilter.city}`)
		}

		if (parsedFilter?.isCurrent !== undefined) {
			conditions.push(Prisma.sql`"is_current" = ${where.isCurrent}`)
		}

		const whereSql = Prisma.join(conditions, Prisma.sql` AND `)
		const take = rangeEnd - rangeStart + 1
		const skip = rangeStart

		const sortFieldMap = {
			id: '"id"',
			createdAt: '"created_at"',
			updatedAt: '"updated_at"',
			isCurrent: '"is_current"',
			title: '"title"',
			date: '"date"',
			city: '"city"'
		}
		const sortColumn = sortFieldMap[sortField] || '"created_at"'
		const sortDirection = sortOrder === 'asc' ? 'ASC' : 'DESC'

		const countResult = await prisma.$queryRaw`
			SELECT COUNT(*)::int AS count
			FROM "Event"
			WHERE ${whereSql}
		`
		const totalEvents = Number(countResult[0]?.count || 0)

		const events = await prisma.$queryRaw`
			SELECT
				"id",
				"created_at" AS "createdAt",
				"updated_at" AS "updatedAt",
				"is_current" AS "isCurrent",
				"title",
				"date",
				"city",
				"text",
				"images"
			FROM "Event"
			WHERE ${whereSql}
			ORDER BY ${Prisma.raw(`${sortColumn} ${sortDirection}`)}
			LIMIT ${take}
			OFFSET ${skip}
		`

		res.set('Content-Range', `events ${rangeStart}-${rangeEnd}/${totalEvents}`)
		return res.json(events)
	}

	const totalEvents = await prisma.event.count({ where })

	const events = await prisma.event.findMany({
		skip: rangeStart,
		take: rangeEnd - rangeStart + 1,
		orderBy: {
			[sortField]: sortOrder
		},
		where
	})

	res.set('Content-Range', `events ${rangeStart}-${rangeEnd}/${totalEvents}`)
	res.json(events)
})

// @desc    Get event
// @route   GET /api/events/:id
// @access  Private
export const getEvent = asyncHandler(async (req, res) => {
	const event = await prisma.event.findUnique({
		where: { id: +req.params.id }
	})

	if (!event) {
		res.status(404)
		throw new Error('Event not found!')
	}

	res.json({ ...event })
})

// @desc    Create new event
// @route 	POST /api/events
// @access  Private
export const createEvent = asyncHandler(async (req, res) => {
	const { title, date, city, text, images } = req.body

	const imagePaths = images.map(image =>
		typeof image === 'object' ? `/uploads/${image.rawFile.path}` : image
	)

	const event = await prisma.event.create({
		data: {
			title,
			date,
			city,
			text,
			images: imagePaths
		}
	})

	res.json(event)
})

// @desc    Update event
// @route 	PUT /api/events/:id
// @access  Private
export const updateEvent = asyncHandler(async (req, res) => {
	const { isCurrent, title, date, city, text, images } = req.body

	try {
		const event = await prisma.event.update({
			where: {
				id: +req.params.id
			},
			data: { isCurrent, title, date, city, text, images }
		})

		res.json(event)
	} catch (error) {
		res.status(404)
		throw new Error('Event not found!')
	}
})

// @desc    Delete Event
// @route 	DELETE /api/events/:id
// @access  Private
export const deleteEvent = asyncHandler(async (req, res) => {
	try {
		const event = await prisma.event.delete({
			where: {
				id: +req.params.id
			}
		})

		res.json({ message: 'Event deleted!' })
	} catch (error) {
		res.status(404)
		throw new Error('Event not found!')
	}
})
