/**
 * 필수입력 규칙
 *
 */
export const requiredRule = (val: any) => {
  return !!val || '내용을 입력해 주시기 바랍니다.'
}

/**
 * 최대입력길이 규칙 (50자)
 *
 */
export const maxLengthRule = (val: any) => {
  if (!val) {
    return true
  }
  return val.length <= 50 || '50자를 초과할 수 없습니다.'
}

/**
 * 특수문자 입력제한 규칙
 *
 */
export const specialCharRule = (val: any) => {
  if (!val) {
    return true
  }
  return !/[~\\/:*?"<>|]/gi.test(val) || '특수문자는 사용할 수 없습니다.'
}
