const createError = require('http-errors');
const User = require('../models/User');
const InstructorCode = require('../models/InstructorCode');

// yeni kullanıcı oluştur (koda göre rol atanır)
const createUser = async ({ name, email, password, role, instructorCode }) => {
  const exists = await User.findOne({ email });
  if (exists) throw createError(409, 'Bu e-posta adresi zaten kayıtlı');

  let assignedRole = 'student';

  if (role === 'instructor') {
    const FALLBACK_CODE = process.env.INSTRUCTOR_SECRET_CODE || 'EGITMEN-AI-2024';

    // Önce sabit fallback kod mu kontrol et
    if (instructorCode === FALLBACK_CODE) {
      assignedRole = 'instructor';
    } else {
      // MongoDB'den admin'in ürettiği kodu kontrol et
      const codeDoc = await InstructorCode.findOne({ code: instructorCode, isUsed: false });
      if (!codeDoc) {
        throw createError(403, 'Geçersiz veya kullanılmış Eğitmen Kayıt Kodu! Yönetici ile iletişime geçin.');
      }
      assignedRole = 'instructor';

      // Kullanıcıyı oluştur, sonra kodu used yap
      const newUser = await User.create({ name, email, password, role: assignedRole });
      codeDoc.isUsed = true;
      codeDoc.usedBy = newUser._id;
      codeDoc.usedAt = new Date();
      await codeDoc.save();
      return newUser;
    }
  }

  return User.create({ name, email, password, role: assignedRole });
};

const authenticateUser = async (email, password) => {
  const user = await User.findOne({ email, isActive: true }).select('+password');
  if (!user) throw createError(401, 'Geçersiz e-posta veya şifre');
  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw createError(401, 'Geçersiz e-posta veya şifre');
  return user;
};

const getUserById = async (id) => {
  const user = await User.findById(id);
  if (!user) throw createError(404, 'Kullanıcı bulunamadı');
  return user;
};

const getAllUsers = async (filters = {}) => {
  const query = {};
  if (filters.role) query.role = filters.role;
  return User.find(query).sort({ createdAt: -1 });
};

const updateUserRole = async (id, role) => {
  const user = await User.findByIdAndUpdate(id, { role }, { new: true, runValidators: true });
  if (!user) throw createError(404, 'Kullanıcı bulunamadı');
  return user;
};

const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId).select('+password');
  if (!user) throw createError(404, 'Kullanıcı bulunamadı');
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) throw createError(401, 'Mevcut şifre yanlış');
  user.password = newPassword;
  await user.save();
  return user;
};

const updateProfile = async (userId, updates) => {
  const allowed = {};
  if (updates.name) allowed.name = updates.name;
  const user = await User.findByIdAndUpdate(userId, allowed, { new: true, runValidators: true });
  if (!user) throw createError(404, 'Kullanıcı bulunamadı');
  return user;
};

const toggleActive = async (id, isActive) => {
  const user = await User.findByIdAndUpdate(id, { isActive }, { new: true });
  if (!user) throw createError(404, 'Kullanıcı bulunamadı');
  return user;
};

// YENİ — Eğitmen kodu üret (sadece admin)
const generateInstructorCode = async (adminId) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'EGITMEN-';
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];

  const newCode = await InstructorCode.create({ code, createdBy: adminId });
  return newCode;
};

// YENİ — Tüm üretilen kodları listele
const listInstructorCodes = async () => {
  return InstructorCode.find().sort({ createdAt: -1 }).populate('usedBy', 'name email');
};

module.exports = {
  createUser,
  authenticateUser,
  getUserById,
  getAllUsers,
  updateUserRole,
  changePassword,
  updateProfile,
  toggleActive,
  generateInstructorCode,
  listInstructorCodes,
};