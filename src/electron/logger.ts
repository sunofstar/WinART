import { app } from 'electron'
import dayjs from 'dayjs'
import logger from 'electron-log'

const level = app.isPackaged ? 'info' : 'debug'
logger.transports.console.format = '[{y}-{m}-{d} {h}:{i}:{s}] {text}'
logger.transports.console.level = level

logger.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}] [{level}] {text}'
logger.transports.file.fileName = `main_${dayjs().format('YYYYMMDD')}.log`
logger.transports.file.level = level
logger.transports.file.maxSize = 5 * 1024 * 1024
// logger.transports.file.resolvePath = () => path.join(app.getAppPath(), 'logs/main.log')

console.error = logger.error

export default logger
