const electronApi = () => {
  if (electronAPI === undefined) {
    console.error('electronAPI 가 준비되지 않았습니다. electron으로 접근해야 정상 작동 됩니다.')
  }

  return electronAPI
}

export default electronApi
