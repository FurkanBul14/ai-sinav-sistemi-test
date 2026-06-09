const express = require('express');
const { getUsers, getUser, updateRole, toggleActive, generateCode, listCodes } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// tüm route'lar admin korumalı
router.use(protect);
router.use(authorize('admin'));

// Eğitmen kodları
router.post('/instructor-codes', generateCode);
router.get('/instructor-codes', listCodes);

// Kullanıcılar
router.get('/', getUsers);
router.get('/:id', getUser);
router.put('/:id/role', updateRole);
router.put('/:id/active', toggleActive);

module.exports = router;