// ==========================================
// AUTHENTICATION LOGIC
// ==========================================

// DOM Elements
const loginForm = document.getElementById('loginForm')
const authForm = document.getElementById('authForm')
const userInfo = document.getElementById('userInfo')
const errorAlert = document.getElementById('errorAlert')
const successAlert = document.getElementById('successAlert')
const logoutBtn = document.getElementById('logoutBtn')
const navToggle = document.getElementById('navToggle')
const nav = document.getElementById('nav')

// Mobile Menu Toggle
navToggle?.addEventListener('click', () => {
  nav?.classList.toggle('active')
})

// ==========================================
// Check Authentication State
// ==========================================
async function checkAuthState() {
  if (!supabaseClient) {
    console.log('Supabase not connected')
    return null
  }

  try {
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (user) {
      displayUserInfo(user)
      return user
    } else {
      displayAuthForm()
      return null
    }
  } catch (error) {
    console.error('Error checking auth state:', error)
    displayAuthForm()
    return null
  }
}

// ==========================================
// Display Functions
// ==========================================
function displayUserInfo(user) {
  authForm.style.display = 'none'
  userInfo.classList.add('show')

  const userName = user.user_metadata?.name || user.email
  const userEmail = user.email

  document.getElementById('userName').textContent = userName
  document.getElementById('userEmail').textContent = userEmail
}

function displayAuthForm() {
  authForm.style.display = 'block'
  userInfo.classList.remove('show')
}

function showError(message) {
  errorAlert.textContent = message
  errorAlert.classList.add('show')
  successAlert.classList.remove('show')
  setTimeout(() => {
    errorAlert.classList.remove('show')
  }, 5000)
}

function showSuccess(message) {
  successAlert.textContent = message
  successAlert.classList.add('show')
  errorAlert.classList.remove('show')
  setTimeout(() => {
    successAlert.classList.remove('show')
  }, 5000)
}

function setLoading(button, loading) {
  button.disabled = loading
  if (loading) {
    button.classList.add('loading')
  } else {
    button.classList.remove('loading')
  }
}

// ==========================================
// Form Switching
// ==========================================
// Removed - no registration option

// ==========================================
// LOGIN
// ==========================================
loginForm?.addEventListener('submit', async (e) => {
  e.preventDefault()

  if (!supabaseClient) {
    showError('Přihlášení není nyní dostupné. Zkuste to později.')
    return
  }

  const email = document.getElementById('loginEmail').value.trim()
  const password = document.getElementById('loginPassword').value

  const loginBtn = document.getElementById('loginBtn')
  setLoading(loginBtn, true)

  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      showError(error.message)
      return
    }

    if (data.user) {
      showSuccess('Úspěšně přihlášeno!')
      setTimeout(() => {
        displayUserInfo(data.user)
        loginForm.reset()
      }, 1000)
    }
  } catch (error) {
    showError('Chyba při přihlašování: ' + error.message)
  } finally {
    setLoading(loginBtn, false)
  }
})

// ==========================================
// LOGOUT
// ==========================================
logoutBtn?.addEventListener('click', async () => {
  if (!supabaseClient) return

  try {
    await supabaseClient.auth.signOut()
    displayAuthForm()
    loginForm.reset()
    showSuccess('Byli jste odhlášeni.')
  } catch (error) {
    showError('Chyba při odhlašování: ' + error.message)
  }
})

// ==========================================
// Initialize on Page Load
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  checkAuthState()
})
