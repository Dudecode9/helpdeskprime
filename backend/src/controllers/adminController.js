import {
  createAdmin,
  loginAdmin,
  getAllAdmins,
  updateAdminPassword,
  deleteAdmin
} from "../services/adminService.js";

// ЛОГИН АДМИНА
export async function adminLogin(req, res) {
  const { email, password } = req.body;

  try {
    const admin = await loginAdmin(email, password);
    res.json({ success: true, admin });
  } catch (err) {
    res.status(401).json({ success: false, message: err.message });
  }
}

// СОЗДАНИЕ АДМИНА (директор)
export async function registerAdmin(req, res) {
  const { email, password } = req.body;

  try {
    const admin = await createAdmin(email, password);
    res.json({ success: true, admin });
  } catch (err) {
    res.status(500).json({ success: false, message: "Ошибка создания админа" });
  }
}

// ПОЛУЧИТЬ ВСЕХ АДМИНОВ
export async function getAdmins(req, res) {
  try {
    const admins = await getAllAdmins();
    res.json({ success: true, admins });
  } catch (err) {
    res.status(500).json({ success: false, message: "Ошибка получения админов" });
  }
}

// ИЗМЕНИТЬ ПАРОЛЬ АДМИНА
export async function changeAdminPassword(req, res) {
  const { email, newPassword } = req.body;

  try {
    const admin = await updateAdminPassword(email, newPassword);

    if (!admin) {
      return res.json({ success: false, message: "Админ не найден" });
    }

    res.json({ success: true, admin });
  } catch (err) {
    res.status(500).json({ success: false, message: "Ошибка обновления пароля" });
  }
}

// 🔥 УДАЛИТЬ АДМИНА
export async function deleteAdminController(req, res) {
  const { email } = req.body;

  try {
    const deleted = await deleteAdmin(email);

    if (!deleted) {
      return res.json({ success: false, message: "Админ не найден" });
    }

    res.json({ success: true, deleted });
  } catch (err) {
    res.status(500).json({ success: false, message: "Ошибка удаления админа" });
  }
}
