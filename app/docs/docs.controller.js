import asyncHandler from 'express-async-handler'

import { prisma } from '../prisma.js'

// @desc    Get docs
// @route   GET /api/docs
// @access  Private
export const getDocuments = asyncHandler(async (req, res) => {
	const { range, sort, filter, all } = req.query

	const sortField = sort ? JSON.parse(sort)[0] : 'id'
	const sortOrder = sort ? JSON.parse(sort)[1].toLowerCase() : 'desc'

	if (all === 'true') {
		const docs = await prisma.document.findMany({
			orderBy: {
				[sortField]: sortOrder
			},
			include: {
				Group: {
					select: {
						title: true
					}
				}
			}
		})
		return res.json(docs)
	}

	const rangeStart = range ? JSON.parse(range)[0] : 0
	const rangeEnd = range ? JSON.parse(range)[1] : 9

	const totalDocuments = await prisma.document.count()

	const docs = await prisma.document.findMany({
		skip: rangeStart,
		take: rangeEnd - rangeStart + 1,
		orderBy: {
			[sortField]: sortOrder
		},
		include: {
			Group: {
				select: {
					title: true
				}
			}
		}
	})

	res.set('Content-Range', `docs ${rangeStart}-${rangeEnd}/${totalDocuments}`)
	res.json(docs)
})

// @desc    Get document
// @route   GET /api/docs/:id
// @access  Private
export const getDocument = asyncHandler(async (req, res) => {
	const document = await prisma.document.findUnique({
		where: { id: +req.params.id },
		include: {
			Group: {
				select: {
					title: true
				}
			}
		}
	})

	if (!document) {
		res.status(404)
		throw new Error('Document not found!')
	}

	res.json({ ...document })
})

// @desc    Create new document
// @route 	POST /api/docs
// @access  Private
export const createDocument = asyncHandler(async (req, res) => {
	const { groupId, title, src } = req.body

	// Если src - это массив, то берем первый элемент, иначе используем значение как есть
	const srcPath = Array.isArray(src)
		? typeof src[0] === 'object'
			? `/docs/${src[0].rawFile.path}`
			: src[0]
		: typeof src === 'object'
			? `/docs/${src.rawFile.path}`
			: src

	const document = await prisma.document.create({
		data: {
			groupId: parseInt(groupId),
			title,
			src: srcPath
		}
	})

	res.json(document)
})

// @desc    Update document
// @route 	PUT /api/docs/:id
// @access  Private
export const updateDocument = asyncHandler(async (req, res) => {
	const { groupId, title, src } = req.body

	try {
		const document = await prisma.document.update({
			where: {
				id: +req.params.id
			},
			data: { groupId: parseInt(groupId), title, src }
		})

		res.json(document)
	} catch (error) {
		res.status(404)
		throw new Error('Document not found!')
	}
})

// @desc    Delete Document
// @route 	DELETE /api/docs/:id
// @access  Private
export const deleteDocument = asyncHandler(async (req, res) => {
	try {
		const document = await prisma.document.delete({
			where: {
				id: +req.params.id
			}
		})

		res.json({ message: 'Document deleted!' })
	} catch (error) {
		res.status(404)
		throw new Error('Document not found!')
	}
})
