// ==========================================
// AUTHENTICATION LOGIC
// ==========================================

// DOM Elements (loaded in DOMContentLoaded to ensure they exist)
let loginForm
let authForm
let userInfo
let errorAlert
let successAlert
let logoutBtn

// Initialize DOM Elements when page is ready
function initializeElements() {
  loginForm = document.getElementById('loginForm')
  authForm = document.getElementById('authForm')
  userInfo = document.getElementById('userInfo')
  errorAlert = document.getElementById('errorAlert')
  successAlert = document.getElementById('successAlert')
  logoutBtn = document.getElementById('logoutBtn')
  
  // Setup event listeners
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin)
  }
  
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout)
  }
}

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
  if (!errorAlert) return
  errorAlert.textContent = message
  errorAlert.classList.add('show')
  if (successAlert) successAlert.classList.remove('show')
  setTimeout(() => {
    errorAlert.classList.remove('show')
  }, 5000)
}

function showSuccess(message) {
  if (!successAlert) return
  successAlert.textContent = message
  successAlert.classList.add('show')
  if (errorAlert) errorAlert.classList.remove('show')
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
async function handleLogin(e) {
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
        window.location.href = './index.html'
      }, 1000)
    }
  } catch (error) {
    showError('Chyba při přihlašování: ' + error.message)
  } finally {
    setLoading(loginBtn, false)
  }
}

// ==========================================
// LOGOUT
// ==========================================
async function handleLogout() {
  if (!supabaseClient) return

  try {
    await supabaseClient.auth.signOut()
    displayAuthForm()
    if (loginForm) loginForm.reset()
    showSuccess('Byli jste odhlášeni.')
  } catch (error) {
    showError('Chyba při odhlašování: ' + error.message)
  }
}

// ==========================================
// Initialize on Page Load
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  initializeElements()
  checkAuthState()
})
