import loginIpc from './loginIpc'
import commIpc from './commonIpc'
import imageIpc from './imageIpc'
import kapedbIpc from './KapeDBIpc' // add 20231031 for kapedb관련 IPC 모듈 등록
import reportIpc from './reportIpc'
export default function init() {
  loginIpc()
  imageIpc()
  commIpc()
  kapedbIpc() // add 20231031
  reportIpc()
}
