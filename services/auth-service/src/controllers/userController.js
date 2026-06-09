const createError = require('http-errors');
const userService = require('../services/userService');

// GET /api/users tüm kullanıcıları listele (sadece admin)
const getUsers = async (req, res) => {
  const { role } = req.query;
  const users = await userService.getAllUsers({ role });
  res.status(200).json({
    success: true,
    count: users.length,
    data: { users },
  });
};

// GET /api/users/:id — tek kullanıcı detayı (sadece admin)
const getUser = async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  res.status(200).json({
    success: true,
    data: { user },
  });
};

// PUT /api/users/:id/role rol değiştir (sadece admin)
const updateRole = async (req, res) => {
  const { role } = req.body;
  if (!role) throw createError(400, 'Rol alanı zorunludur');
  const validRoles = ['student', 'instructor', 'admin'];
  if (!validRoles.includes(role)) throw createError(400, 'Geçersiz rol değeri');
  if (req.params.id === req.user.id.toString()) {
    throw createError(403, 'Kendi rolünüzü değiştiremezsiniz');
  }
  const user = await userService.updateUserRole(req.params.id, role);
  res.status(200).json({
    success: true,
    message: `Kullanıcı rolü '${role}' olarak güncellendi`,
    data: { user },
  });
};

// PUT /api/users/:id/active — hesap aktif/pasif (admin)
const toggleActive = async (req, res) => {
  const { isActive } = req.body;
  if (typeof isActive !== 'boolean') throw createError(400, 'isActive alanı boolean olmalıdır');
  if (req.params.id === req.user.id.toString()) {
    throw createError(403, 'Kendi hesabınızı deaktif edemezsiniz');
  }
  const user = await userService.toggleActive(req.params.id, isActive);
  res.status(200).json({
    success: true,
    message: isActive ? 'Hesap aktifleştirildi' : 'Hesap deaktif edildi',
    data: { user },
  });
};

// POST /api/users/instructor-codes — Yeni eğitmen kodu üret (admin)
const generateCode = async (req, res) => {
  const code = await userService.generateInstructorCode(req.user.id);
  res.status(201).json({
    success: true,
    message: 'Eğitmen kayıt kodu üretildi',
    data: { code },
  });
};

// GET /api/users/instructor-codes — Tüm üretilen kodları listele (admin)
const listCodes = async (req, res) => {
  const codes = await userService.listInstructorCodes();
  res.status(200).json({
    success: true,
    count: codes.length,
    data: { codes },
  });
};

module.exports = { getUsers, getUser, updateRole, toggleActive, generateCode, listCodes };