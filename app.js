// ==========================================
// CONFIG: Paste your Supabase credentials here
// ==========================================
const SUPABASE_URL = 'https://aatrphwytongvaozwrrp.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhdHJwaHd5dG9uZ3Zhb3p3cnJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4MDU2ODYsImV4cCI6MjA5NTM4MTY4Nn0.zjxRdQW5P1tcHvXeUZeG2MDhsTqfMkF97o17EncyxeY'

let supabaseClient = null
let isConnected = false

// Try to initialize Supabase
try {
  if (SUPABASE_URL.includes('your-project')) {
    throw new Error('Credentials not configured')
  }
  supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
  isConnected = true
} catch (e) {
  console.log('Supabase not configured yet - showing demo data')
  isConnected = false
}

// ==========================================
// Mobile Menu Toggle
// ==========================================
const navToggle = document.getElementById('navToggle')
const nav = document.getElementById('nav')

navToggle.addEventListener('click', () => {
  nav.classList.toggle('active')
})

// ==========================================
// Mock Data (Fallback)
// ==========================================
const mockArticles = [
  { title: 'Výsledek schůzky výboru', content: 'Dne 15. 1. 2024 proběhla schůzka výboru SVJ...', created_at: '2024-01-15' },
  { title: 'Plánovaná údržba výtahu', content: 'V termínu 20. - 22. 1. 2024 proběhne údržba...', created_at: '2024-01-10' }
]

const mockEvents = [
  { title: 'Shromáždění vlastníků', event_date: '2024-02-15', description: 'Výroční shromáždění vlastníků jednotek' },
  { title: 'Úklid společných prostor', event_date: '2024-01-25', description: 'Jarní úklid vchodu a zahrady' }
]

// ==========================================
// Render Functions
// ==========================================
function renderArticles(articles) {
  const container = document.getElementById('articlesList')
  const badge = document.getElementById('articlesBadge')
  
  if (!articles || articles.length === 0) {
    container.innerHTML = '<div class="empty-state">Žádné články k zobrazení.</div>'
    badge.textContent = '0 článků'
    badge.className = 'badge'
    return
  }

  container.innerHTML = articles.map(article => `
    <div class="dynamic-card">
      <h4>${escapeHtml(article.title)}</h4>
      <p>${escapeHtml(article.content || article.description || '')}</p>
      <div class="meta">${formatDate(article.created_at || article.event_date)}</div>
    </div>
  `).join('')
  
  badge.textContent = `${articles.length} článků`
  badge.className = 'badge live'
}

function renderEvents(events) {
  const container = document.getElementById('eventsList')
  const badge = document.getElementById('eventsBadge')
  
  if (!events || events.length === 0) {
    container.innerHTML = '<div class="empty-state">Žádné nadcházející události.</div>'
    badge.textContent = '0 událostí'
    badge.className = 'badge'
    return
  }

  container.innerHTML = events.map(event => `
    <div class="dynamic-card">
      <h4>${escapeHtml(event.title)}</h4>
      <p>${escapeHtml(event.description || event.content || '')}</p>
      <div class="meta">${formatDate(event.event_date || event.created_at)}</div>
    </div>
  `).join('')
  
  badge.textContent = `${events.length} událostí`
  badge.className = 'badge live'
}

// ==========================================
// Helpers
// ==========================================
function escapeHtml(text) {
  if (!text) return ''
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (isNaN(date)) return dateString
  return date.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' })
}

// ==========================================
// Fetch from Supabase (or use mock data)
// ==========================================
async function loadData() {
  if (!isConnected || !supabaseClient) {
    // Show mock data immediately
    renderArticles(mockArticles)
    renderEvents(mockEvents)
    return
  }

  try {
    // Fetch articles
    const { data: articles, error: articlesError } = await supabaseClient
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3)

    if (articlesError) throw articlesError

    // Fetch events
    const { data: events, error: eventsError } = await supabaseClient
      .from('events')
      .select('*')
      .gte('event_date', new Date().toISOString().split('T')[0])
      .order('event_date', { ascending: true })
      .limit(3)

    if (eventsError) throw eventsError

    renderArticles(articles)
    renderEvents(events)
  } catch (error) {
    console.error('Supabase error:', error)
    // Fallback to mock data on error
    renderArticles(mockArticles)
    renderEvents(mockEvents)
  }
}

// ==========================================
// Initialize
// ==========================================
document.addEventListener('DOMContentLoaded', loadData)
