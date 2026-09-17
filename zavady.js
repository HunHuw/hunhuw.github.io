// DEFECT REPORTING LOGIC
(function() {
  // DOM Elements
  const defectForm = document.getElementById('defectForm');
  const emailInput = document.getElementById('email');
  const phoneInput = document.getElementById('phone');
  const unitInput = document.getElementById('unit');
  const photoInput = document.getElementById('photo');
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
      phoneInput.value = user.user_metadata?.phone || '';
      unitInput.value = user.user_metadata?.unit || '';

      return true;
    } catch (error) {
      console.error('Error loading user data:', error);
      showError('Chyba při načítání uživatelských dat');
      return false;
    }
  }

  // Photo Upload Handler
  if (photoInput) {
    photoInput.addEventListener('change', (e) => {
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
  async function saveDefectToSupabase(defectData, photoBase64 = null) {
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
            photo_data: photoBase64 || null,
            photo_filename: defectData.photoFilename || null,
            status: 'Nové',
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
  if (defectForm) {
    defectForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      setLoading(true);

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
        };

        // Validace
        if (!formData.category) {
          showError('Prosím vyberte kategorii.');
          setLoading(false);
          return;
        }

        if (!formData.description) {
          showError('Prosím napište popis problému.');
          setLoading(false);
          return;
        }

        // Konverze fotky na base64 (pokud existuje)
        let photoBase64 = null;
        if (photoInput.files[0]) {
          photoBase64 = await fileToBase64(photoInput.files[0]);
        }

        // Uložení do Supabase
        await saveDefectToSupabase(formData, photoBase64);

        // Úspěch
        showSuccess('Hlášení bylo úspěšně odesláno! Správce jej brzy prověří.');
        defectForm.reset();
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
