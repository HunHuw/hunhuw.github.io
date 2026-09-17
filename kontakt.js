// CONTACT FORM LOGIC
(function() {
  // DOM Elements
  const contactForm = document.getElementById('contactForm');
  const emailInput = document.getElementById('email');
  const subjectInput = document.getElementById('subject');
  const messageInput = document.getElementById('message');
  const attachmentInput = document.getElementById('attachment');
  const fileNameDisplay = document.getElementById('fileName');
  const alertError = document.getElementById('errorAlert');
  const alertSuccess = document.getElementById('successAlert');
  const submitBtn = document.getElementById('submitBtn');

  // Show Alerts
  function showError(message) {
    if (!alertError) return;
    alertError.textContent = message;
    alertError.classList.add('show');
    if (alertSuccess) alertSuccess.classList.remove('show');
    setTimeout(() => {
      alertError.classList.remove('show');
    }, 5000);
  }

  function showSuccess(message) {
    if (!alertSuccess) return;
    alertSuccess.textContent = message;
    alertSuccess.classList.add('show');
    if (alertError) alertError.classList.remove('show');
    setTimeout(() => {
      alertSuccess.classList.remove('show');
    }, 5000);
  }

  function setLoading(loading) {
    if (!submitBtn) return;
    submitBtn.disabled = loading;
    if (loading) {
      submitBtn.classList.add('loading');
    } else {
      submitBtn.classList.remove('loading');
    }
  }

  // Load User Data
  async function loadUserData() {
    if (!supabaseClient) {
      showError('Chyba: Supabase není připojen');
      return false;
    }

    try {
      const {
        data: { user },
      } = await supabaseClient.auth.getUser();

      if (!user) {
        showError('Musíte být přihlášeni. Přesměrovávám na přihlášení...');
        setTimeout(() => {
          window.location.href = './ucet.html';
        }, 2000);
        return false;
      }

      // Naplnění formuláře
      emailInput.value = user.email || '';

      return true;
    } catch (error) {
      console.error('Error loading user data:', error);
      showError('Chyba při načítání uživatelských dat');
      return false;
    }
  }

  // File Upload Handler
  if (attachmentInput) {
    attachmentInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        fileNameDisplay.textContent = `✓ ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
      } else {
        fileNameDisplay.textContent = '';
      }
    });
  }

  // Convert File to Base64
  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  }

  // Save to Supabase
  async function saveContactToSupabase(contactData, attachmentBase64 = null) {
    try {
      const { data, error } = await supabaseClient
        .from('zpravy')
        .insert([
          {
            email: contactData.email,
            subject: contactData.subject,
            message: contactData.message,
            attachment_data: attachmentBase64 || null,
            attachment_filename: contactData.attachmentFilename || null,
            status: 'Nová',
          },
        ]);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Supabase error:', error);
      throw error;
    }
  }

  // Form Submission
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      setLoading(true);

      try {
        // Sběr dat z formuláře
        const formData = {
          email: emailInput.value.trim(),
          subject: subjectInput.value.trim(),
          message: messageInput.value.trim(),
          attachmentFilename: attachmentInput.files[0]?.name || null,
        };

        // Validace
        if (!formData.subject) {
          showError('Prosím napište předmět.');
          setLoading(false);
          return;
        }

        if (!formData.message) {
          showError('Prosím napište zprávu.');
          setLoading(false);
          return;
        }

        // Konverze souboru na base64 (pokud existuje)
        let attachmentBase64 = null;
        if (attachmentInput.files[0]) {
          attachmentBase64 = await fileToBase64(attachmentInput.files[0]);
        }

        // Uložení do Supabase
        await saveContactToSupabase(formData, attachmentBase64);

        // Úspěch
        showSuccess('Zpráva byla úspěšně odeslaná! Výbor vám brzy odpoví.');
        contactForm.reset();
        fileNameDisplay.textContent = '';

        // Přesměrování za chvíli
        setTimeout(() => {
          window.location.href = './index.html';
        }, 2000);
      } catch (error) {
        console.error('Error:', error);
        showError('Chyba: ' + error.message);
      } finally {
        setLoading(false);
      }
    });
  }

  // Initialize on Page Load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      loadUserData();
    });
  } else {
    loadUserData();
  }
})();
