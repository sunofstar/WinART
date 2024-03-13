import fs from 'fs'
import dayjs from 'dayjs'
/**
 * 숫자에 세자리 마다 콤마를 추가
 *
 * @param num 숫자
 * @returns 콤마가 포함된 문자열
 */
export function numberWithCommas(num: number | undefined) {
  if (num == undefined) {
    return ''
  }
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/**
 * 화면 날짜 포맷 함수
 *
 *
 * @param date 날짜, string
 * @returns 'YYYY-MM-DD HH:mm'
 */

export function setDate(date: Date | string | null, when: string): string {
  if (!date) {
    return ''
  }
  // (1) 입력된 값이 문자열인 경우
  if (typeof date === 'string') {
    const year = date.slice(0, 4)
    const month = date.slice(4, 6)
    const day = date.slice(6, 8)

    if (when === 'start') {
      // start인 경우 HH:mm을 00:00으로 고정
      return `${year}-${month}-${day} 00:00`
    } else if (when === 'end') {
      // end인 경우 HH:mm을 23:59로 고정
      return `${year}-${month}-${day} 23:59`
    } else {
      // (2) Date객체인 경우
      const year = date.getFullYear()
      const month = ('0' + (date.getMonth() + 1)).slice(-2)
      const day = ('0' + date.getDate()).slice(-2)

      if (when === 'start') {
        // start인 경우 HH:mm을 00:00으로 고정
        return `${year}-${month}-${day} 00:00`
      } else if (when === 'end') {
        // end인 경우 HH:mm을 23:59로 고정
        return `${year}-${month}-${day} 23:59`
      }
    }
  }
}

/**
 * 증거이미지 생성 폴더 일시 포맷 함수
 *
 *
 * @param date 날짜, string
 * @returns 'YYYYMMDDHHmmss'
 */

export function getFormattedCurrentDate() {
  const currentDate = new Date()
  const year = currentDate.getFullYear()
  const month = String(currentDate.getMonth() + 1).padStart(2, '0')
  const day = String(currentDate.getDate()).padStart(2, '0')
  const hours = String(currentDate.getHours()).padStart(2, '0')
  const minutes = String(currentDate.getMinutes()).padStart(2, '0')

  return `${year}${month}${day}${hours}${minutes}`
}

/**
 *
 * 파일 상위 ParentFolder 경로 가져오는 함수
 *
 * @param fullPath 전체 경로, string
 * @returns 마지막 파일명 상위 경로
 */

export function getParentFolder(fullPath) {
  return fullPath.substring(0, fullPath.lastIndexOf('\\'))
}

/**
 * 케이스 생성일시 폴더명 포맷 함수
 *
 *
 * @param Date 현재 일시
 * @returns 'YYYYMMDDHHmmss'
 */

export function generateTimestamp() {
  const currentDate = new Date()

  const formattedMonth = ('0' + (currentDate.getMonth() + 1)).slice(-2)
  const formattedDate = ('0' + currentDate.getDate()).slice(-2)
  const formattedHours = ('0' + currentDate.getHours()).slice(-2)
  const formattedMinutes = ('0' + currentDate.getMinutes()).slice(-2)
  const formattedSeconds = ('0' + currentDate.getSeconds()).slice(-2)

  return `${currentDate.getFullYear()}${formattedMonth}${formattedDate}${formattedHours}${formattedMinutes}${formattedSeconds}`
}
