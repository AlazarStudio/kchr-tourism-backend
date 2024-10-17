import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import morgan from 'morgan'
import multer from 'multer'
import path from 'path'

import { errorHandler, notFound } from './app/middleware/error.middleware.js'

import authRoutes from './app/auth/auth.routes.js'
import newsRoutes from './app/news/news.routes.js'
import { prisma } from './app/prisma.js'
import projectRoutes from './app/projects/projects.routes.js'
import userRoutes from './app/user/user.routes.js'

dotenv.config()

const app = express()

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
	const fileTypes = /jpeg|jpg|png|gif|pdf|doc|docx/ // Поддержка других типов файлов
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
	limits: { fileSize: 1024 * 1024 * 12 }, // лимит размера файла 8MB
	fileFilter: fileFilter
})

app.use(
	cors({
		exposedHeaders: ['Content-Range']
	})
)

async function main() {
	if (process.env.NODE_ENV === 'development') app.use(morgan('dev'))

	app.use(express.json())

	const __dirname = path.resolve()

	// Статическая папка для загрузки файлов
	app.use('/uploads', express.static(path.join(__dirname, '/uploads/')))

	// Маршрут для загрузки изображений
	app.post('/uploads', (req, res) => {
		upload.array('images', 20)(req, res, function (err) {
			if (err instanceof multer.MulterError) {
				// Ошибки, связанные с Multer (например, превышен размер файла)
				return res.status(400).json({ message: err.message })
			} else if (err) {
				// Другие ошибки
				return res
					.status(500)
					.json({ message: 'Ошибка при загрузке файлов', error: err })
			}

			// Если загрузка прошла успешно
			const filePaths = req.files.map(file => `/uploads/${file.filename}`)
			return res.json({ filePaths })
		})
	})

	app.use('/api/auth', authRoutes)
	app.use('/api/users', userRoutes)
	app.use('/api/news', newsRoutes)
	app.use('/api/projects', projectRoutes)

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
