import { createAdmin, loginAdmin } from "../services/adminService.js";

export async function registerAdmin(req, res) {
  const { email, password } = req.body;

  console.log("LOGIN REQUEST:", email, password);


  try {
    const admin = await createAdmin(email, password);
    console.log("LOGIN RESULT:", admin);
    res.json(admin);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create admin" });
  }
}

export async function adminLogin(req, res) {
  const { email, password } = req.body;

  try {
    const admin = await loginAdmin(email, password);
    res.json({ success: true, admin });
  } catch (err) {
    res.status(401).json({ success: false, message: err.message });
  }
}