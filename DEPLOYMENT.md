# Инструкция по развертыванию на сервере

## Предварительная подготовка

Убедитесь, что на сервере установлены:
- Node.js (версия 16 или выше)
- npm
- PostgreSQL
- Доступ к серверу через SSH

## Шаг 1: Клонирование проекта

```bash
cd /path/to/your/project
git pull origin main
```

## Шаг 2: Установка зависимостей

```bash
npm install
```

## Шаг 3: Настройка переменных окружения

Создайте файл `.env` в корне проекта со следующими переменными:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/database_name"
PORT=443
NODE_ENV=production
SERVER=https://backend.kch-tourism.ru
BOT_TOKEN=your_telegram_bot_token
CHAT_ID=your_telegram_chat_id
TAG_NAME=#yourTagName
TAG_STORIES=#yourTagStories

# Опционально - пути к SSL сертификатам (если отличаются от стандартных)
# SSL_KEY_PATH=/path/to/privkey.pem
# SSL_CERT_PATH=/path/to/fullchain.pem
```

## Шаг 4: Применение миграций Prisma

```bash
npx prisma migrate deploy
npx prisma generate
```

## Шаг 5: Создание директории для логов

```bash
mkdir -p logs
```

## Шаг 6: Установка PM2 глобально

```bash
sudo npm install pm2 -g
```

## Шаг 7: Запуск приложения через PM2

```bash
# Запуск приложения
pm2 start ecosystem.config.js

# Просмотр статуса
pm2 list

# Просмотр логов
pm2 logs kchr-tourism-backend
```

## Шаг 8: Настройка автозапуска при старте системы

```bash
# Сохранение текущей конфигурации PM2
pm2 save

# Настройка автозапуска
pm2 startup

# Выполните команду, которую выведет pm2 startup
# Она будет выглядеть примерно так:
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u your_user --hp /home/your_user
```

## Полезные команды PM2

### Управление процессами

```bash
# Список всех процессов
pm2 list

# Перезапуск приложения
pm2 restart kchr-tourism-backend

# Остановка приложения
pm2 stop kchr-tourism-backend

# Удаление из PM2
pm2 delete kchr-tourism-backend

# Перезапуск всех приложений
pm2 restart all
```

### Просмотр логов

```bash
# Просмотр логов в реальном времени
pm2 logs

# Просмотр логов конкретного приложения
pm2 logs kchr-tourism-backend

# Последние 100 строк логов
pm2 logs --lines 100

# Очистка логов
pm2 flush
```

### Мониторинг

```bash
# Интерактивный мониторинг
pm2 monit

# Информация о конкретном приложении
pm2 show kchr-tourism-backend

# Использование памяти и CPU
pm2 status
```

## Обновление приложения

После внесения изменений в код:

```bash
# 1. Обновите код на сервере
git pull origin main

# 2. Установите зависимости (если изменились)
npm install

# 3. Примените миграции (если есть новые)
npx prisma migrate deploy

# 4. Перезапустите приложение
pm2 restart kchr-tourism-backend

# 5. Проверьте логи
pm2 logs kchr-tourism-backend --lines 50
```

## Проверка SSL сертификатов

Если сервер не запускается из-за SSL, проверьте:

```bash
# Проверка существования файлов
ls -la /etc/letsencrypt/live/backend.kch-tourism.ru/

# Проверка прав доступа
sudo chmod 644 /etc/letsencrypt/live/backend.kch-tourism.ru/fullchain.pem
sudo chmod 600 /etc/letsencrypt/live/backend.kch-tourism.ru/privkey.pem
```

Если SSL сертификаты недоступны, сервер автоматически запустится в HTTP режиме на порту 4000 с предупреждением.

## Диагностика проблем

### Сервер не запускается

1. Проверьте логи PM2:
   ```bash
   pm2 logs kchr-tourism-backend --err
   ```

2. Проверьте подключение к базе данных:
   ```bash
   npx prisma db push
   ```

3. Проверьте порты:
   ```bash
   sudo netstat -tulpn | grep LISTEN
   ```

### Сервер падает

1. Просмотрите логи ошибок:
   ```bash
   cat logs/err.log
   ```

2. Проверьте использование памяти:
   ```bash
   pm2 status
   free -h
   ```

3. Увеличьте лимит памяти в `ecosystem.config.js` если нужно:
   ```javascript
   max_memory_restart: '2G'
   ```

## Безопасность

1. Убедитесь, что `.env` файл не попал в git:
   ```bash
   git status
   ```

2. Настройте firewall для портов:
   ```bash
   sudo ufw allow 443
   sudo ufw allow 80
   ```

3. Регулярно обновляйте зависимости:
   ```bash
   npm audit
   npm audit fix
   ```

## Резервное копирование

Не забывайте делать резервные копии:
- База данных PostgreSQL
- Папка `uploads/`
- Файл `.env`

```bash
# Пример бэкапа БД
pg_dump database_name > backup_$(date +%Y%m%d).sql
```
