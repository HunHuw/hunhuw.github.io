// ==========================================
// AUTHENTICATION LOGIC
// ==========================================

// DOM Elements
const loginForm = document.getElementById('loginForm')
const registerForm = document.getElementById('registerForm')
const authForm = document.getElementById('authForm')
const userInfo = document.getElementById('userInfo')
const errorAlert = document.getElementById('errorAlert')
const successAlert = document.getElementById('successAlert')
const formSwitchBtns = document.querySelectorAll('.form-switch-btn')
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
formSwitchBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    const form = btn.dataset.form
    
    // Update active button
    formSwitchBtns.forEach((b) => b.classList.remove('active'))
    btn.classList.add('active')

    // Show/hide forms
    const loginContent = loginForm.parentElement
    const registerContent = registerForm.parentElement
    
    if (form === 'login') {
      loginContent.classList.add('active')
      registerContent.classList.remove('active')
    } else {
      registerContent.classList.add('active')
      loginContent.classList.remove('active')
    }

    // Clear alerts
    errorAlert.classList.remove('show')
    successAlert.classList.remove('show')
  })
})

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
// REGISTER
// ==========================================
registerForm?.addEventListener('submit', async (e) => {
  e.preventDefault()

  if (!supabaseClient) {
    showError('Registrace není nyní dostupná. Zkuste to později.')
    return
  }

  const name = document.getElementById('registerName').value.trim()
  const email = document.getElementById('registerEmail').value.trim()
  const password = document.getElementById('registerPassword').value
  const password2 = document.getElementById('registerPassword2').value

  // Validation
  if (!name) {
    showError('Prosím zadejte své jméno.')
    return
  }

  if (password !== password2) {
    showError('Hesla se neshodují.')
    return
  }

  if (password.length < 6) {
    showError('Heslo musí mít alespoň 6 znaků.')
    return
  }

  const registerBtn = document.getElementById('registerBtn')
  setLoading(registerBtn, true)

  try {
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
        },
      },
    })

    if (error) {
      showError(error.message)
      return
    }

    if (data.user) {
      showSuccess('Registrace byla úspěšná! Ověřte svůj email.')
      registerForm.reset()
      
      // After successful registration, try to auto-login
      setTimeout(() => {
        displayAuthForm()
        document.querySelectorAll('.form-switch-btn')[0].click()
      }, 2000)
    }
  } catch (error) {
    showError('Chyba při registraci: ' + error.message)
  } finally {
    setLoading(registerBtn, false)
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
    registerForm.reset()
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
