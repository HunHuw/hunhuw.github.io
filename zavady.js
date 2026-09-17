// ==========================================
// DEFECT REPORTING LOGIC
// ==========================================

// Resend API configuration
const RESEND_API_KEY = 're_RyXJjysf_JAwDbZ7af6r25yZFNFSx5iFd'
const ADMIN_EMAIL = 'milda191919@gmail.com'

// DOM Elements
const defectForm = document.getElementById('defectForm')
const emailInput = document.getElementById('email')
const phoneInput = document.getElementById('phone')
const unitInput = document.getElementById('unit')
const photoInput = document.getElementById('photo')
const fileNameDisplay = document.getElementById('fileName')
const errorAlert = document.getElementById('errorAlert')
const successAlert = document.getElementById('successAlert')
const submitBtn = document.getElementById('submitBtn')

// Mobile Menu
const navToggle = document.getElementById('navToggle')
const nav = document.getElementById('nav')

if (navToggle && nav) {
  navToggle.addEventListener('click', () => {
    nav.classList.toggle('active')
  })
}

// ==========================================
// Show Alerts
// ==========================================
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

function setLoading(loading) {
  if (!submitBtn) return
  submitBtn.disabled = loading
  if (loading) {
    submitBtn.classList.add('loading')
  } else {
    submitBtn.classList.remove('loading')
  }
}

// ==========================================
// Load User Data
// ==========================================
async function loadUserData() {
  if (!supabaseClient) {
    showError('Chyba: Supabase není připojen')
    return false
  }

  try {
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      showError('Musíte být přihlášeni. Přesměrovávám na přihlášení...')
      setTimeout(() => {
        window.location.href = './ucet.html'
      }, 2000)
      return false
    }

    // Naplnění formuláře
    emailInput.value = user.email || ''
    phoneInput.value = user.user_metadata?.phone || ''
    unitInput.value = user.user_metadata?.unit || ''

    return true
  } catch (error) {
    console.error('Error loading user data:', error)
    showError('Chyba při načítání uživatelských dat')
    return false
  }
}

// ==========================================
// Photo Upload Handler
// ==========================================
photoInput?.addEventListener('change', (e) => {
  const file = e.target.files[0]
  if (file) {
    fileNameDisplay.textContent = `✓ ${file.name} (${(file.size / 1024).toFixed(1)} KB)`
  } else {
    fileNameDisplay.textContent = ''
  }
})

// ==========================================
// Convert File to Base64
// ==========================================
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result)
    reader.onerror = (error) => reject(error)
  })
}

// ==========================================
// Send Email via Resend
// ==========================================
async function sendEmailViaResend(defectData, photoBase64 = null) {
  try {
    // Vytvořit HTML obsah emailu
    const emailContent = `
      <h2>Nové hlášení závady</h2>
      <p><strong>Email:</strong> ${defectData.email}</p>
      <p><strong>Telefon:</strong> ${defectData.phone}</p>
      <p><strong>Jednotka:</strong> ${defectData.unit}</p>
      <p><strong>Kategorie:</strong> ${defectData.category}</p>
      <p><strong>Urgentnost:</strong> ${defectData.urgency}</p>
      <p><strong>Popis:</strong></p>
      <p>${defectData.description.replace(/\n/g, '<br>')}</p>
      <p><strong>Datum hlášení:</strong> ${new Date().toLocaleString('cs-CZ')}</p>
      ${photoBase64 ? '<p><strong>Fotografie je připojena.</strong></p>' : ''}
    `

    // Příprava attachmentů
    const attachments = []
    if (photoBase64) {
      // Base64 string na objekt
      const base64Data = photoBase64.split(',')[1]
      const fileName = photoInput.files[0].name
      attachments.push({
        filename: fileName,
        content: base64Data,
      })
    }

    // Odeslání přes Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'SVJ Navigátorů <noreply@resend.dev>',
        to: ADMIN_EMAIL,
        reply_to: defectData.email,
        subject: `[Hlášení závady] ${defectData.category} - ${defectData.urgency}`,
        html: emailContent,
        ...(attachments.length > 0 && { attachments }),
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Chyba při odesílání emailu')
    }

    return await response.json()
  } catch (error) {
    console.error('Email error:', error)
    throw error
  }
}

// ==========================================
// Save to Supabase
// ==========================================
async function saveDefectToSupabase(defectData) {
  try {
    const { data, error } = await supabaseClient
      .from('zavady')
      .insert([
        {
          email: defectData.email,
          phone: defectData.phone,
          unit: defectData.unit,
          category: defectData.category,
          description: defectData.description,
          urgency: defectData.urgency,
          photo_filename: defectData.photoFilename || null,
          created_at: new Date().toISOString(),
          status: 'Nové',
        },
      ])

    if (error) throw error
    return data
  } catch (error) {
    console.error('Supabase error:', error)
    throw error
  }
}

// ==========================================
// Form Submission
// ==========================================
defectForm?.addEventListener('submit', async (e) => {
  e.preventDefault()

  setLoading(true)

  try {
    // Sběr dat z formuláře
    const formData = {
      email: emailInput.value.trim(),
      phone: phoneInput.value.trim(),
      unit: unitInput.value.trim(),
      category: document.getElementById('category').value,
      description: document.getElementById('description').value.trim(),
      urgency: document.querySelector('input[name="urgency"]:checked').value,
      photoFilename: photoInput.files[0]?.name || null,
    }

    // Validace
    if (!formData.category) {
      showError('Prosím vyberte kategorii.')
      setLoading(false)
      return
    }

    if (!formData.description) {
      showError('Prosím napište popis problému.')
      setLoading(false)
      return
    }

    // Konverze fotky na base64 (pokud existuje)
    let photoBase64 = null
    if (photoInput.files[0]) {
      photoBase64 = await fileToBase64(photoInput.files[0])
    }

    // Uložení do Supabase
    await saveDefectToSupabase(formData)

    // Odeslání emailu
    await sendEmailViaResend(formData, photoBase64)

    // Úspěch
    showSuccess('Hlášení bylo úspěšně odesláno! Děkujeme za vaši zprávu.')
    defectForm.reset()
    fileNameDisplay.textContent = ''

    // Přesměrování za chvíli
    setTimeout(() => {
      window.location.href = './index.html'
    }, 2000)
  } catch (error) {
    console.error('Error:', error)
    showError('Chyba: ' + error.message)
  } finally {
    setLoading(false)
  }
})

// ==========================================
// Initialize on Page Load
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  loadUserData()
})
