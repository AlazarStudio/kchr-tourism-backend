import axios from 'axios'
import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import fs from 'fs'
import morgan from 'morgan'
import multer from 'multer'
import path from 'path'

import { errorHandler, notFound } from './app/middleware/error.middleware.js'

import aboutUsRoutes from './app/aboutUs/aboutUs.routes.js'
import authRoutes from './app/auth/auth.routes.js'
import bsRoutes from './app/bs/bs.routes.js'
import eventRoutes from './app/events/events.routes.js'
import newsRoutes from './app/news/news.routes.js'
import { prisma } from './app/prisma.js'
import projectRoutes from './app/projects/projects.routes.js'
import userRoutes from './app/user/user.routes.js'

dotenv.config()

const app = express()

const token = process.env.BOT_TOKEN
const chatId = process.env.CHAT_ID
const tagName = process.env.TAG_NAME

// Настройка хранилища для загрузки файлов
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, 'uploads/')
	},
	filename: function (req, file, cb) {
		cb(null, Date.now() + path.extname(file.originalname)) // уникальное имя файла
	}
})

const fileFilter = (req, file, cb) => {
	const fileTypes = /jpeg|jpg|png|gif|pdf|doc|docx/
	const extname = fileTypes.test(path.extname(file.originalname).toLowerCase())
	const mimetype = fileTypes.test(file.mimetype)

	if (mimetype && extname) {
		return cb(null, true)
	} else {
		cb('Ошибка: недопустимый тип файла!')
	}
}

const upload = multer({
	storage: storage,
	limits: { fileSize: 1024 * 1024 * 12 }, // лимит размера файла 12MB
	fileFilter: fileFilter
})

app.use(
	cors({
		origin: '*',
		exposedHeaders: ['Content-Range']
	})
)

app.use('/uploads', express.static(path.join(path.resolve(), '/uploads/')))

const downloadPhoto = async (fileId, filePath) => {
	try {
		const fileUrl = `https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`
		const fileResponse = await axios.get(fileUrl)
		const filePathOnServer = fileResponse.data.result.file_path

		const downloadUrl = `https://api.telegram.org/file/bot${token}/${filePathOnServer}`

		const response = await axios({
			url: downloadUrl,
			method: 'GET',
			responseType: 'stream'
		})

		return new Promise((resolve, reject) => {
			const writer = fs.createWriteStream(filePath)
			response.data.pipe(writer)
			writer.on('finish', resolve)
			writer.on('error', reject)
		})
	} catch (error) {
		console.error('Ошибка при загрузке фотографии:', error)
	}
}

const formatDate = timestamp => {
	const date = new Date(timestamp * 1000)
	const day = date.getDate().toString().padStart(2, '0')
	const month = (date.getMonth() + 1).toString().padStart(2, '0')
	const year = date.getFullYear()
	return `${year}-${month}-${day}`
}

// Маршрут для получения новостей из Telegram
app.get('/api/news/telegram', async (req, res) => {
	try {
		const url = `https://api.telegram.org/bot${token}/getUpdates?chat_id=${chatId}`
		// console.log(url)
		const response = await axios.get(url)
		// console.log(response)

		if (response.data.ok) {
			const messages = response.data.result

			const uploadsDir = path.join(path.resolve(), 'uploads')
			if (!fs.existsSync(uploadsDir)) {
				fs.mkdirSync(uploadsDir)
			}

			const groupedMessages = {}
			for (const data of messages) {
				if (data.channel_post) {
					const mediaGroupId = data.channel_post.media_group_id
					if (mediaGroupId) {
						if (!groupedMessages[mediaGroupId]) {
							groupedMessages[mediaGroupId] = []
						}
						groupedMessages[mediaGroupId].push(data)
					} else {
						groupedMessages[data.update_id] = [data]
					}
				}
			}

			const textsAndPhotos = await Promise.all(
				Object.values(groupedMessages).map(async group => {
					const firstPost = group[0].channel_post
					const date = formatDate(firstPost.date)
					let caption = firstPost.caption || ''

					if (!caption.endsWith(tagName)) {
						return null
					}

					caption = caption.replace(tagName, '').trim()
					const parts = caption.split('\n\n')
					let title = ''
					let text = ''

					if (parts.length > 1) {
						title = parts[0]
						text = parts.slice(1).join('\n\n')
					}

					const photos = await Promise.all(
						group.map(async data => {
							if (data.channel_post.photo) {
								const photo =
									data.channel_post.photo[data.channel_post.photo.length - 1]
								const filePath = path.join(uploadsDir, `${photo.file_id}.jpg`)
								await downloadPhoto(photo.file_id, filePath)
								return `${photo.file_id}.jpg`
							}
							return null
						})
					)

					const validPhotos = photos.filter(photo => photo !== null)

					try {
						const isoDate = new Date(date).toISOString()
						// console.log(encodeURIComponent(isoDate))
						// console.log(encodeURIComponent(title))
						// console.log(encodeURIComponent(text))
						// console.log(`[${validPhotos.join(', ')}]`)
						// Добавляем префикс '/uploads/' перед каждым именем файла
						const validPhotosWithPath = validPhotos.map(
							photo => `/uploads/${photo}`
						)

						// Преобразуем массив в JSON-строку и кодируем его
						const encodedImages = encodeURIComponent(
							JSON.stringify(validPhotosWithPath)
						)
						const apiUrl = `http://localhost:4000/api/news/create?title=${encodeURIComponent(title)}&date=${encodeURIComponent(isoDate)}&text=${encodeURIComponent(text)}&images=${encodedImages}`
						const apiResponse = await axios.get(apiUrl)
						// console.log(`api response: ${apiResponse.data}`)
					} catch (error) {
						console.error(`Проблема с запросом: ${error.message}`)
					}

					return {
						message_id: firstPost.message_id,
						caption,
						date,
						title,
						text,
						photos: validPhotos.map(fileId => ({
							url: `/uploads/${fileId}`
						}))
					}
				})
			)

			res.json(textsAndPhotos.filter(item => item !== null))
		} else {
			res
				.status(500)
				.json({ error: 'Не удалось получить сообщения из Telegram API' })
		}
	} catch (error) {
		console.error('Ошибка при получении сообщений:', error)
		res.status(500).json({ error: 'Не удалось получить сообщения' })
	}
})

async function main() {
	if (process.env.NODE_ENV === 'development') app.use(morgan('dev'))

	app.use(express.json())

	// Маршрут для загрузки изображений
	app.post('/uploads', (req, res) => {
		upload.array('images', 20)(req, res, function (err) {
			if (err instanceof multer.MulterError) {
				return res.status(400).json({ message: err.message })
			} else if (err) {
				return res
					.status(500)
					.json({ message: 'Ошибка при загрузке файлов', error: err })
			}

			const filePaths = req.files.map(file => `/uploads/${file.filename}`)
			return res.json({ filePaths })
		})
	})

	app.use('/api/auth', authRoutes)
	app.use('/api/users', userRoutes)
	app.use('/api/news', newsRoutes)
	app.use('/api/projects', projectRoutes)
	app.use('/api/business-support', bsRoutes)
	app.use('/api/events', eventRoutes)
	app.use('/api/about-us', aboutUsRoutes)

	app.use(notFound)
	app.use(errorHandler)

	const PORT = process.env.PORT || 4000

	app.listen(
		PORT,
		console.log(`Server running in ${process.env.NODE_ENV} on port ${PORT}`)
	)
}

main()
	.then(async () => {
		await prisma.$disconnect()
	})
	.catch(async e => {
		console.error(e)
		await prisma.$disconnect()
		process.exit(1)
	})
