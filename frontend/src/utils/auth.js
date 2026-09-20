let inMemoryToken = null
let currentUser = null

export const setAuthToken = (token) => {
  inMemoryToken = token
}

export const getAuthToken = () => {
  return inMemoryToken
}

export const setUser = (user) => {
  currentUser = user
}

export const getUser = () => {
  return currentUser
}

export const clearAuth = () => {
  inMemoryToken = null
  currentUser = null
}
