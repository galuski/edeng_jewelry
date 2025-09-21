import Cryptr from 'cryptr'

if (!process.env.SECRET) {
  throw new Error('❌ Missing SECRET in .env')
}
const cryptr = new Cryptr(process.env.SECRET)

export const userService = {
  checkLogin,
  getLoginToken,
  validateToken
}

function checkLogin({ username, password }) {
  const adminUser = process.env.ADMIN_USER
  const adminPass = process.env.ADMIN_PASS

  if (username === adminUser && password === adminPass) {
    return Promise.resolve({
      _id: 'admin',
      fullname: 'Admin User'
    })
  } else {
    return Promise.reject('Invalid username or password')
  }
}

function getLoginToken(user) {
  const str = JSON.stringify(user)
  return cryptr.encrypt(str)
}

function validateToken(token) {
  try {
    const str = cryptr.decrypt(token)
    return JSON.parse(str)
  } catch {
    return null
  }
}