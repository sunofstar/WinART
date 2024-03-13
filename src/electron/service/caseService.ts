import fs from 'fs'
import path from 'path'
import { ArtCaseInfo, TriageCaseInfo } from '../../shared/models'

/**
 * case 정보 읽기
 */
const readTriageCase = (filepath: string): TriageCaseInfo | null => {
  try {
    const triageCaseInfo = JSON.parse(fs.readFileSync(filepath, { encoding: 'utf8' }))
    return triageCaseInfo
  } catch (err: any) {
    return null
  }
}

/**
 * case 저장
 */
const saveCase = (caseInfo: ArtCaseInfo): string => {
  const casePathName = path.join(caseInfo.caseFolder, `art_${caseInfo.caseName}.cse`)
  fs.writeFileSync(casePathName, JSON.stringify(caseInfo, null, 2))
  return casePathName
}

export default {
  readTriageCase,
  saveCase
}
