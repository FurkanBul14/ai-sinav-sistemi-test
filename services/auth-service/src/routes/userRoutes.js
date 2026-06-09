const express = require('express');
const { getUsers, getUser, updateRole, toggleActive, generateCode, listCodes } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

// Eğitmen kodları — sadece admin
router.post('/instructor-codes', authorize('admin'), generateCode);
router.get('/instructor-codes', authorize('admin'), listCodes);

// Kullanıcı listeleme — eğitmen ve admin görebilir
router.get('/', authorize('admin', 'instructor'), getUsers);
router.get('/:id', authorize('admin', 'instructor'), getUser);

// Rol/aktiflik değişikliği — sadece admin
router.put('/:id/role', authorize('admin'), updateRole);
router.put('/:id/active', authorize('admin'), toggleActive);

module.exports = router;