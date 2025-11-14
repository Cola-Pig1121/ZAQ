// 获取用户IP地址的函数
export const getUserIP = async (): Promise<string> => {
  try {
    // 尝试使用多个IP获取服务
    const ipServices = [
      'https://api.ipify.org?format=json',
      'https://ipapi.co/json/',
      'https://api.ip.sb/jsonip'
    ]
    
    for (const service of ipServices) {
      try {
        const response = await fetch(service)
        const data = await response.json()
        const ip = data.ip || data.query
        if (ip) return ip
      } catch (error) {
        console.log(`IP服务 ${service} 失败:`, error)
        continue
      }
    }
    
    // 如果所有服务都失败，返回默认值
    return 'unknown'
  } catch (error) {
    console.error('获取IP失败:', error)
    return 'unknown'
  }
}