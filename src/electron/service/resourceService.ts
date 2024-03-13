import logger from '../logger'
import si, { Systeminformation } from 'systeminformation'
import _ from 'lodash'
import net from 'net'
import {
  AppResourceProgress,
  EfaChannel,
  InitChannelRcv,
  InitChannelSend,
  NetworkInfo,
  SystemInfo
} from '../../shared/models'
import NetworkInterfacesData = Systeminformation.NetworkInterfacesData

/**
 * 시스템 정보 반환
 *
 * @returns 시스템 정보
 */
const getSystemInfo = async (): Promise<SystemInfo> => {
  const systemInfo: SystemInfo = {
    manufacturer: '',
    model: '',
    serial: '',
    platform: '',
    distro: '',
    release: '',
    cpuManufacturer: '',
    cpuBrand: ''
  }
  // 제조사,모델명,시리얼넘버
  const system = await si.system()
  systemInfo.manufacturer = system.manufacturer
  systemInfo.model = system.model
  systemInfo.serial = system.serial
  // OS 정보
  const osInfo = await si.osInfo()
  systemInfo.platform = osInfo.platform
  systemInfo.distro = osInfo.distro
  systemInfo.release = osInfo.release
  // CPU 정보
  const cpuInfo = await si.cpu()
  systemInfo.cpuManufacturer = cpuInfo.manufacturer
  systemInfo.cpuBrand = cpuInfo.brand

  return systemInfo
}

/**
 * 현재 네트워크 정보 반환
 *
 * @returns 네트워크 정보
 */
const getNetworkInfo = async (): Promise<NetworkInfo> => {
  const networkInfo: NetworkInfo = {
    macAddress: '',
    ip4: ''
  }
  // 전체 목록

  const networkInterfaces = (await si.networkInterfaces()) as Array<NetworkInterfacesData>
  // 대상 필터 (유선)
  const list = networkInterfaces.filter(
    (item: any) =>
      // item.ip4 &&
      item.mac &&
      !item.virtual &&
      item.type == 'wired' &&
      // item.operstate == 'up' &&
      !item.ifaceName.toLowerCase().includes('bluetooth')
  )
  if (list.length) {
    networkInfo.ip4 = list[0].ip4
    networkInfo.macAddress = list[0].mac.replaceAll(':', '-')
  }

  return networkInfo
}

export default {
  getSystemInfo,
  getNetworkInfo
}
