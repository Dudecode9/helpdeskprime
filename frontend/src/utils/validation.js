const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value) {
  return emailPattern.test(value.trim());
}

export function validateTicketForm({ email, phone, message }) {
  if (!email.trim()) {
    return "Email is required.";
  }

  if (!isValidEmail(email)) {
    return "Enter a valid email address.";
  }

  if (!phone.trim()) {
    return "Phone is required.";
  }

  if (phone.trim().length < 5) {
    return "Phone must be at least 5 characters.";
  }

  if (!message.trim()) {
    return "Message is required.";
  }

  if (message.trim().length < 10) {
    return "Message must be at least 10 characters.";
  }

  return "";
}

export function validateLoginForm({ email, password }) {
  if (!email.trim()) {
    return "Email is required.";
  }

  if (!isValidEmail(email)) {
    return "Enter a valid email address.";
  }

  if (!password) {
    return "Password is required.";
  }

  if (password.length < 8) {
    return "Password must be at least 8 characters.";
  }

  return "";
}

export function validateAdminMutationForm({ email, password }) {
  return validateLoginForm({ email, password });
}

export function validatePasswordForm(password, label = "Password") {
  if (!password) {
    return `${label} is required.`;
  }

  if (password.length < 8) {
    return `${label} must be at least 8 characters.`;
  }

  return "";
}
