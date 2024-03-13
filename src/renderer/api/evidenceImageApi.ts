import {
  AnalysisLog,
  CaseInfo,
  CreateCase,
  HashVal,
  HashState,
  AcquisitionType,
  AcquisitionImageExport,
  EvidenceImageState,
  Report1Send,
  Report2Send
} from '@share/models'
import { EVIDENCE_CHANNELS } from '../../shared/constants'
import { CreateEvidenceImage } from '../../shared/models'

/**
 * 획득 이미지 대한 타입 확인
 *
 * @returns 획득 이미지 타입
 */
const acquisitionType = async (casepath: string): Promise<AcquisitionType> => {
  return window.ipcRenderer.invoke(EVIDENCE_CHANNELS.acquisitionType, casepath)
}

let OnExportState: any = null
/**
 * 획득 이미지 내보내기
 * @param imageExport 획득 이미지 내보내기 정보
 * @param onState 내보내기 상태
 */
const exportImage = async (
  imageExport: AcquisitionImageExport,
  onState: (evidenceImageInfo: EvidenceImageState) => void
): Promise<void> => {
  OnExportState = onState
  window.ipcRenderer.send(EVIDENCE_CHANNELS.exportImage, imageExport)
}
window.ipcRenderer.on(EVIDENCE_CHANNELS.exportImageState, async (state: EvidenceImageState): Promise<void> => {
  if (OnExportState) OnExportState(state)
})

let OnCreateState: any = null

/**
 * 증거 이미지 생성
 * @param createImage  증거 이미지 생성 정보
 * @param onState 증거 이미지 생성 상태
 */
const createEvidenceImage = async (
  createImage: CreateEvidenceImage,
  onState: (evidenceImageInfo: EvidenceImageState) => void
): Promise<void> => {
  OnCreateState = onState
  window.ipcRenderer.send(EVIDENCE_CHANNELS.createImage, createImage)
}

window.ipcRenderer.on(EVIDENCE_CHANNELS.createImageState, async (state: EvidenceImageState): Promise<void> => {
  if (OnCreateState) OnCreateState(state)
})

let HashOnState: any = null

const getFileHash = async (
  filePath: string,
  onState: (state: 'data' | 'end' | 'error', percent: number, hashObj?: HashVal) => void
): Promise<void> => {
  console.log('getFileHash')
  HashOnState = onState
  window.ipcRenderer.send(EVIDENCE_CHANNELS.getFileHash, filePath)
}
window.ipcRenderer.on(EVIDENCE_CHANNELS.getFileHashState, async (state: HashState): Promise<void> => {
  if (HashOnState) HashOnState(state.state, state.percent, state.hash)
})

const makeReport1 = async (reportinfo: Report1Send): Promise<boolean> => {
  return window.ipcRenderer.invoke(EVIDENCE_CHANNELS.make_report1, reportinfo)
}
const makeReport2 = async (reportinfo: Report2Send): Promise<boolean> => {
  return window.ipcRenderer.invoke(EVIDENCE_CHANNELS.make_report2, reportinfo)
}

export default {
  acquisitionType,
  exportImage,
  getFileHash,
  makeReport1,
  makeReport2,
  createEvidenceImage
}
