/**
 * Minimalist Online Registration Form
 * Frontend Logic & Supabase PostgreSQL Integration
 */

// ============================================================================
// 1. SUPABASE CONFIGURATION
// Replace the placeholder values below with your actual Supabase credentials.
// You can find these in your Supabase Dashboard under:
// Project Settings -> API -> Project URL & Project API Keys (anon / public)
// ============================================================================
const SUPABASE_URL = 'https://jvqjeoamppaugejuwzbk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_30RaHgP4STYIgA0UqjWA_A_5zp31hPv';

// Initialize Supabase Client instance (safely checks if CDN and credentials exist)
let supabaseClient = null;

function isPlaceholderConfig() {
  return (
    !SUPABASE_URL ||
    !SUPABASE_ANON_KEY ||
    SUPABASE_URL === 'YOUR_SUPABASE_URL' ||
    SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY' ||
    SUPABASE_URL.includes('your-project-id')
  );
}

function initSupabase() {
  if (typeof window.supabase === 'undefined') {
    console.error('Supabase client library is not loaded.');
    return false;
  }

  if (isPlaceholderConfig()) {
    // Show setup reminder notice on page
    const configNotice = document.getElementById('configNotice');
    if (configNotice) {
      configNotice.style.display = 'flex';
    }
    return false;
  }

  try {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return true;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return false;
  }
}

// ============================================================================
// 2. DOM ELEMENTS
// ============================================================================
const form = document.getElementById('registrationForm');
const usernameInput = document.getElementById('username');
const emailInput = document.getElementById('email');
const dobInput = document.getElementById('dob');
const submitBtn = document.getElementById('submitBtn');
const buttonSpinner = document.getElementById('buttonSpinner');
const buttonText = document.getElementById('buttonText');

const successCard = document.getElementById('successCard');
const successDetail = document.getElementById('successDetail');
const successMeta = document.getElementById('successMeta');

const errorCard = document.getElementById('errorCard');
const errorTitle = document.getElementById('errorTitle');
const errorDetail = document.getElementById('errorDetail');

const currentYearEl = document.getElementById('currentYear');

// Field Error & Group references
const fields = {
  username: {
    input: usernameInput,
    group: document.getElementById('group-username'),
    error: document.getElementById('username-error')
  },
  email: {
    input: emailInput,
    group: document.getElementById('group-email'),
    error: document.getElementById('email-error')
  },
  dob: {
    input: dobInput,
    group: document.getElementById('group-dob'),
    error: document.getElementById('dob-error')
  }
};

// ============================================================================
// 3. DATE OF BIRTH CONSTRAINT SETUP
// ============================================================================
/**
 * Sets the maximum allowed date of birth to today's local date (YYYY-MM-DD),
 * preventing users from choosing future dates via the browser's date picker.
 */
function setupDateLimits() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const maxDate = `${year}-${month}-${day}`;

  dobInput.setAttribute('max', maxDate);
  dobInput.setAttribute('min', '1900-01-01');
}

// ============================================================================
// 4. VALIDATION FUNCTIONS
// ============================================================================
function setFieldError(fieldName, message) {
  const field = fields[fieldName];
  if (!field) return;

  field.group.classList.add('has-error');
  field.error.textContent = message;
  field.input.setAttribute('aria-invalid', 'true');
}

function clearFieldError(fieldName) {
  const field = fields[fieldName];
  if (!field) return;

  field.group.classList.remove('has-error');
  field.error.textContent = '';
  field.input.removeAttribute('aria-invalid');
}

function clearAllErrors() {
  Object.keys(fields).forEach(clearFieldError);
  hideFeedbackMessages();
}

function validateUsername(value) {
  const trimmed = value.trim();
  if (!trimmed) {
    return 'Username is required.';
  }
  if (trimmed.length < 2) {
    return 'Username must be at least 2 characters.';
  }
  if (trimmed.length > 50) {
    return 'Username cannot exceed 50 characters.';
  }
  const usernameRegex = /^[a-zA-Z0-9_.-]+$/;
  if (!usernameRegex.test(trimmed)) {
    return 'Username may only contain letters, numbers, dots, hyphens, and underscores.';
  }
  return null;
}

function validateEmail(value) {
  const trimmed = value.trim();
  if (!trimmed) {
    return 'Email address is required.';
  }
  // Standard RFC 5322 compatible client email pattern
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  if (!emailRegex.test(trimmed)) {
    return 'Please enter a valid email address (e.g. name@example.com).';
  }
  return null;
}

function validateDob(value) {
  if (!value) {
    return 'Date of birth is required.';
  }

  const selectedDate = new Date(value + 'T00:00:00');
  if (isNaN(selectedDate.getTime())) {
    return 'Please enter a valid calendar date.';
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (selectedDate > today) {
    return 'Date of birth cannot be in the future.';
  }

  const minDate = new Date('1900-01-01T00:00:00');
  if (selectedDate < minDate) {
    return 'Date of birth cannot be earlier than 1900.';
  }

  return null;
}

/**
 * Validates all fields together.
 * Returns true if valid, false otherwise. Focuses the first invalid field.
 */
function validateForm() {
  let isValid = true;
  let firstInvalidField = null;

  // Validate Username
  const usernameError = validateUsername(usernameInput.value);
  if (usernameError) {
    setFieldError('username', usernameError);
    isValid = false;
    firstInvalidField = firstInvalidField || usernameInput;
  } else {
    clearFieldError('username');
  }

  // Validate Email
  const emailError = validateEmail(emailInput.value);
  if (emailError) {
    setFieldError('email', emailError);
    isValid = false;
    firstInvalidField = firstInvalidField || emailInput;
  } else {
    clearFieldError('email');
  }

  // Validate Date of Birth
  const dobError = validateDob(dobInput.value);
  if (dobError) {
    setFieldError('dob', dobError);
    isValid = false;
    firstInvalidField = firstInvalidField || dobInput;
  } else {
    clearFieldError('dob');
  }

  if (!isValid && firstInvalidField) {
    firstInvalidField.focus();
  }

  return isValid;
}

// ============================================================================
// 5. UI STATE MANAGEMENT (Loading, Success, Error)
// ============================================================================
function setLoadingState(isLoading) {
  if (isLoading) {
    submitBtn.disabled = true;
    submitBtn.classList.add('is-loading');
    buttonSpinner.style.display = 'inline-block';
    buttonText.textContent = 'Registering...';
    usernameInput.disabled = true;
    emailInput.disabled = true;
    dobInput.disabled = true;
  } else {
    submitBtn.disabled = false;
    submitBtn.classList.remove('is-loading');
    buttonSpinner.style.display = 'none';
    buttonText.textContent = 'Complete Registration';
    usernameInput.disabled = false;
    emailInput.disabled = false;
    dobInput.disabled = false;
  }
}

function hideFeedbackMessages() {
  successCard.style.display = 'none';
  errorCard.style.display = 'none';
}

function showSuccessMessage(record) {
  hideFeedbackMessages();
  successDetail.textContent = `Thank you, ${record.username}! Your registration was permanently saved to the database.`;

  if (record.id) {
    successMeta.textContent = `Registration ID: ${record.id}`;
  } else {
    successMeta.textContent = `Recorded at ${new Date().toLocaleTimeString()} • Verified in Supabase`;
  }

  successCard.style.display = 'flex';
  successCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function showErrorMessage(title, detail) {
  hideFeedbackMessages();
  errorTitle.textContent = title;
  errorDetail.textContent = detail;
  errorCard.style.display = 'flex';
  errorCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ============================================================================
// 6. FORM SUBMISSION HANDLER
// ============================================================================
async function handleFormSubmit(event) {
  event.preventDefault();
  hideFeedbackMessages();

  // Step 1: Validate client inputs
  if (!validateForm()) {
    return;
  }

  // Step 2: Ensure Supabase client is ready
  if (isPlaceholderConfig() || !supabaseClient) {
    showErrorMessage(
      'Supabase Credentials Needed',
      'Please open script.js and configure your actual SUPABASE_URL and SUPABASE_ANON_KEY. See README.md for step-by-step instructions.'
    );
    return;
  }

  const payload = {
    username: usernameInput.value.trim(),
    email: emailInput.value.trim().toLowerCase(),
    dob: dobInput.value
  };

  // Step 3: Set loading state
  setLoadingState(true);

  try {
    // Step 4: Insert record into Supabase PostgreSQL
    // We insert without .select() so anonymous visitors without SELECT permissions
    // are not blocked by PostgreSQL Row Level Security.
    const { error } = await supabaseClient
      .from('registrations')
      .insert([payload]);

    if (error) {
      console.error('Supabase Insert Error:', error);
      throw error;
    }

    // Step 5: Display success message upon database confirmation
    showSuccessMessage(payload);

    // Step 6: Reset form on successful submission
    form.reset();
    setupDateLimits();

  } catch (err) {
    console.error('Submission failed:', err);

    let userMessage = 'Unable to save registration. Please verify your connection and try again.';

    if (err.code === '23505') {
      userMessage = 'A registration with this email address already exists.';
    } else if (err.message) {
      userMessage = err.message;
    }

    showErrorMessage('Submission Error', userMessage);

  } finally {
    // Step 7: Reset loading state
    setLoadingState(false);
  }
}

// ============================================================================
// 7. REAL-TIME INPUT LISTENERS (Clear errors on change)
// ============================================================================
function attachInputListeners() {
  usernameInput.addEventListener('input', () => {
    if (fields.username.group.classList.contains('has-error')) {
      const err = validateUsername(usernameInput.value);
      if (!err) clearFieldError('username');
    }
  });

  emailInput.addEventListener('input', () => {
    if (fields.email.group.classList.contains('has-error')) {
      const err = validateEmail(emailInput.value);
      if (!err) clearFieldError('email');
    }
  });

  dobInput.addEventListener('change', () => {
    if (fields.dob.group.classList.contains('has-error')) {
      const err = validateDob(dobInput.value);
      if (!err) clearFieldError('dob');
    }
  });
}

// ============================================================================
// 8. INITIALIZATION
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
  // Set current copyright year
  if (currentYearEl) {
    currentYearEl.textContent = new Date().getFullYear();
  }

  // Setup Date of Birth limits (prevent future dates)
  setupDateLimits();

  // Attach real-time input validation listeners
  attachInputListeners();

  // Initialize Supabase client
  initSupabase();

  // Attach submit handler
  form.addEventListener('submit', handleFormSubmit);
});
