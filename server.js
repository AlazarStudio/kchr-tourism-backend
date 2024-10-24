import axios from 'axios'
import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import fs from 'fs'
import https from 'https'
import morgan from 'morgan'
import multer from 'multer'
import path from 'path'
import sharp from 'sharp'

import { errorHandler, notFound } from './app/middleware/error.middleware.js'

import aboutUsRoutes from './app/aboutUs/aboutUs.routes.js'
import authRoutes from './app/auth/auth.routes.js'
import bsRoutes from './app/bs/bs.routes.js'
import documentRoutes from './app/docs/docs.routes.js'
import eventRoutes from './app/events/events.routes.js'
import groupRoutes from './app/group/group.routes.js'
import newsRoutes from './app/news/news.routes.js'
import { prisma } from './app/prisma.js'
import projectRoutes from './app/projects/projects.routes.js'
import storiesRoutes from './app/stories/stories.routes.js'
import userRoutes from './app/user/user.routes.js'
import visitRoutes from './app/visitPlaces/visitPlaces.routes.js'

dotenv.config()

const app = express()

const serverConfig = process.env.SERVER
const token = process.env.BOT_TOKEN
const chatId = process.env.CHAT_ID
const tagName = process.env.TAG_NAME
const tagStories = process.env.TAG_STORIES

// Используем память для временного хранения файлов
const storage = multer.memoryStorage()

const upload = multer({
	storage: storage,
	limits: { fileSize: 1024 * 1024 * 48 }, // лимит размера файла 48MB
	fileFilter: (req, file, cb) => {
		const fileTypes = /jpeg|jpg|png|gif/
		const extname = fileTypes.test(
			path.extname(file.originalname).toLowerCase()
		)
		const mimetype = fileTypes.test(file.mimetype)

		if (mimetype && extname) {
			return cb(null, true)
		} else {
			cb('Ошибка: недопустимый тип файла!')
		}
	}
})

// Функция загрузки документов с проверкой типов файлов
const uploadDocuments = multer({
	storage: storage,
	limits: { fileSize: 1024 * 1024 * 256 }, // лимит размера файла 256MB
	fileFilter: (req, file, cb) => {
		cb(null, true) // Временно пропускаем все файлы для тестирования
	}
	// fileFilter: (req, file, cb) => {
	// 	// Объявление переменной с допустимыми типами файлов
	// 	const allowedFileTypes = /pdf|doc|docx|xls|xlsx|rtf/
	// 	const extname = allowedFileTypes.test(
	// 		path.extname(file.originalname).toLowerCase()
	// 	)

	// 	// Выводим mimetype в консоль для проверки
	// 	console.log('Тип файла:', file.mimetype)

	// 	// Проверка для rtf и других документов
	// 	const mimetype =
	// 		file.mimetype === 'application/rtf' ||
	// 		file.mimetype === 'application/octet-stream' ||
	// 		allowedFileTypes.test(file.mimetype)

	// 	if (mimetype && extname) {
	// 		return cb(null, true)
	// 	} else {
	// 		cb(new Error('Ошибка: недопустимый тип документа!'))
	// 	}
	// }
})

app.use(
	cors({
		origin: '*',
		exposedHeaders: ['Content-Range']
	})
)

app.use('/uploads', express.static(path.join(path.resolve(), '/uploads/')))
app.use(express.json({ limit: '10mb', type: 'application/json' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

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
			const messages = response.data.result.filter(
				update =>
					update.channel_post && update.channel_post.chat.id !== -1002152382917
			)
			console.log('Фильтрованные сообщения:', messages)

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
						const apiUrl = `${serverConfig}/news/create?title=${encodeURIComponent(title)}&date=${encodeURIComponent(isoDate)}&text=${encodeURIComponent(text)}&images=${encodedImages}`
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

// Маршрут для получения сторисов из Telegram
app.get('/api/stories/telegram', async (req, res) => {
	try {
		const url = `https://api.telegram.org/bot${token}/getUpdates?chat_id=${chatId}`
		// console.log(url)
		const response = await axios.get(url)
		// console.log(response)

		if (response.data.ok) {
			const messages = response.data.result.filter(
				update =>
					update.channel_post && update.channel_post.chat.id !== -1002152382917
			)
			console.log('Фильтрованные сообщения:', messages)

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

					if (!caption.endsWith(tagStories)) {
						return null
					}

					caption = caption.replace(tagStories, '').trim()
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
						const apiUrl = `${serverConfig}/stories/create?title=${encodeURIComponent(title)}&date=${encodeURIComponent(isoDate)}&text=${encodeURIComponent(text)}&images=${encodedImages}`
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

	// Обновленный маршрут для загрузки файлов и конвертации в WebP
	// Обновленный маршрут для загрузки файлов и конвертации в WebP
	app.post('/uploads', upload.array('images', 20), async (req, res) => {
		try {
			const files = req.files
			const filePaths = []

			for (const file of files) {
				// Определяем расширение файла
				const ext = path.extname(file.originalname).toLowerCase()

				// Проверяем, является ли файл GIF
				if (ext === '.gif') {
					// Сохраняем GIF без конвертации
					const gifFilename = `${Date.now()}-${file.originalname}`
					const gifFilePath = path.join('uploads', gifFilename)

					// Сохраняем GIF в папку 'uploads'
					fs.writeFileSync(gifFilePath, file.buffer)

					filePaths.push(`/uploads/${gifFilename}`)
				} else {
					// Если это не GIF, конвертируем в WebP
					const webpFilename = `${Date.now()}-${file.originalname.split('.')[0]}.webp`
					const webpFilePath = path.join('uploads', webpFilename)

					// Конвертация изображения в формат WebP с использованием sharp
					await sharp(file.buffer)
						.webp({ quality: 80 }) // Настройка качества WebP
						.toFile(webpFilePath)

					filePaths.push(`/uploads/${webpFilename}`)
				}
			}

			res.json({ filePaths })
		} catch (error) {
			console.error('Ошибка при конвертации изображений:', error)
			res
				.status(500)
				.json({ message: 'Ошибка при конвертации изображений', error })
		}
	})

	// Функция транслитерации русского текста в латиницу с заменой пробелов на подчеркивания
	const transliterate = text => {
		const ru = {
			а: 'a',
			б: 'b',
			в: 'v',
			г: 'g',
			д: 'd',
			е: 'e',
			ё: 'e',
			ж: 'zh',
			з: 'z',
			и: 'i',
			й: 'y',
			к: 'k',
			л: 'l',
			м: 'm',
			н: 'n',
			о: 'o',
			п: 'p',
			р: 'r',
			с: 's',
			т: 't',
			у: 'u',
			ф: 'f',
			х: 'h',
			ц: 'ts',
			ч: 'ch',
			ш: 'sh',
			щ: 'sch',
			ъ: '',
			ы: 'y',
			ь: '',
			э: 'e',
			ю: 'yu',
			я: 'ya'
		}
		return text
			.split('')
			.map(char => {
				if (char === ' ') {
					return '_' // Заменяем пробелы на подчеркивание
				}
				return ru[char.toLowerCase()] || char // Транслитерируем или оставляем символ без изменений
			})
			.join('')
	}

	app.post(
		'/upload-doc',
		uploadDocuments.single('document'),
		async (req, res) => {
			try {
				const file = req.file

				// Проверьте, есть ли файл
				if (!file) {
					return res.status(400).json({ message: 'Файл не был загружен' })
				}

				// Конвертируем имя файла в строку UTF-8
				const originalName = Buffer.from(file.originalname, 'latin1').toString(
					'utf-8'
				)

				// Извлечение имени файла и расширения
				const name = path.basename(originalName, path.extname(originalName))
				const extension = path.extname(originalName)

				// Транслитерация имени файла
				const transliteratedName = transliterate(name)

				// Формируем новое имя файла с оригинальным расширением
				const fileName = `${transliteratedName}${extension}`

				// Сохраняем файл в папку 'uploads'
				const filePath = path.join('uploads', fileName)

				// Сохраняем файл в указанную директорию
				fs.writeFileSync(filePath, file.buffer)

				// Отправляем ссылку на загруженный файл обратно клиенту
				res.json({ filePath: `/uploads/${fileName}` })
			} catch (error) {
				console.error('Ошибка при загрузке документа:', error)
				res
					.status(500)
					.json({ message: 'Ошибка при загрузке документа', error })
			}
		}
	)

	app.use('/api/auth', authRoutes)
	app.use('/api/users', userRoutes)
	app.use('/api/news', newsRoutes)
	app.use('/api/projects', projectRoutes)
	app.use('/api/business-support', bsRoutes)
	app.use('/api/events', eventRoutes)
	app.use('/api/about-us', aboutUsRoutes)
	app.use('/api/visit', visitRoutes)
	app.use('/api/stories', storiesRoutes)
	app.use('/api/docs', documentRoutes)
	app.use('/api/group', groupRoutes)

	app.use(notFound)
	app.use(errorHandler)

	// const PORT = process.env.PORT || 4000

	const PORT = process.env.PORT || 443

	const sslOptions = {
		key: fs.readFileSync(
			'../../../etc/letsencrypt/live/backend.kch-tourism.ru/privkey.pem'
		),
		cert: fs.readFileSync(
			'../../../etc/letsencrypt/live/backend.kch-tourism.ru/fullchain.pem'
		)
	}

	https.createServer(sslOptions, app).listen(PORT, () => {
		console.log(`HTTPS server running on port ${PORT}`)
	})

	// app.listen(
	// 	PORT,
	// 	console.log(`Server running in ${process.env.NODE_ENV} on port ${PORT}`)
	// )
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
