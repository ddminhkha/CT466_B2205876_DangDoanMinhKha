const express = require('express');
const router = express.Router();
const Publisher = require('../models/Publisher');
const { verifyToken, requireRole } = require('../middleware/auth');

// create publisher
router.post('/', verifyToken, requireRole(['admin']), async (req, res) => {
    try {
        const p = new Publisher(req.body);
        await p.save();
        res.json(p);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// list
router.get('/', async (req, res) => {
    try {
        const list = await Publisher.find().sort({ createdAt: -1 });
        res.json(list);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// update
router.put('/:id', verifyToken, requireRole(['admin']), async (req, res) => {
    try {
        const p = await Publisher.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(p);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// delete
router.delete('/:id', verifyToken, requireRole(['admin']), async (req, res) => {
    try {
        await Publisher.findByIdAndDelete(req.params.id);
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

module.exports = router;
