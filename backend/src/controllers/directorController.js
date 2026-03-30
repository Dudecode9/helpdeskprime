import {
  registerDirector,
  loginDirector,
  updateDirectorPassword
} from "../services/directorService.js";

// Регистрация директора
export async function directorRegister(req, res) {
  const { email, password } = req.body;

  try {
    const director = await registerDirector(email, password);
    res.json({ success: true, director });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to register director" });
  }
}

// Вход директора
export async function directorLogin(req, res) {
  const { email, password } = req.body;

  try {
    const director = await loginDirector(email, password);
    if (!director) {
      return res.json({ success: false, message: "Invalid email or password" });
    }

    res.json({ success: true, director });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Login failed" });
  }
}

// 🔥 Смена пароля директора
export async function changeDirectorPassword(req, res) {
  const { newPassword } = req.body;

  try {
    const director = await updateDirectorPassword(newPassword);

    if (!director) {
      return res.json({ success: false, message: "Director not found" });
    }

    res.json({ success: true, director });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Password update failed" });
  }
}
