import { Router } from 'express'
import { pool } from '../db/client.js'
import { upload } from '../middleware/upload.js'
import path from 'path'
import fs from 'fs'

const router = Router()
const UPLOADS = process.env.UPLOADS_DIR || './uploads'

// GET /api/notes
router.get('/', async (req, res, next) => {
  try {
    const { category, contact_id, q } = req.query
    let query = `
      SELECT n.*,
        c.full_name AS contact_name
      FROM notes n
      LEFT JOIN contacts c ON c.id = n.contact_id
      WHERE n.user_id = $1 AND n.deleted_at IS NULL
    `
    const params = [req.userId]
    let i = 2
    if (category && category !== 'All') {
      query += ` AND n.category = $${i++}`; params.push(category)
    }
    if (contact_id) {
      query += ` AND n.contact_id = $${i++}`; params.push(contact_id)
    }
    if (q) {
      query += ` AND (n.title ILIKE $${i} OR n.body ILIKE $${i})`; params.push(`%${q}%`); i++
    }
    query += ' ORDER BY n.updated_at DESC'
    const { rows } = await pool.query(query, params)
    res.json(rows)
  } catch (e) { next(e) }
})

// GET /api/notes/:id
router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT n.*, c.full_name AS contact_name FROM notes n
       LEFT JOIN contacts c ON c.id = n.contact_id
       WHERE n.id = $1 AND n.user_id = $2 AND n.deleted_at IS NULL`,
      [req.params.id, req.userId]
    )
    if (!rows[0]) return res.status(404).json({ error: 'Not found' })
    res.json(rows[0])
  } catch (e) { next(e) }
})

// POST /api/notes
router.post('/', async (req, res, next) => {
  try {
    const { title, body, category = 'General', contact_id } = req.body
    const { rows } = await pool.query(
      `INSERT INTO notes (user_id, title, body, category, contact_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.userId, title || '', body || '', category, contact_id || null]
    )
    res.status(201).json(rows[0])
  } catch (e) { next(e) }
})

// PUT /api/notes/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { title, body, category, contact_id, photo_paths } = req.body
    const { rows } = await pool.query(
      `UPDATE notes SET
        title = COALESCE($3, title),
        body = COALESCE($4, body),
        category = COALESCE($5, category),
        contact_id = $6,
        photo_paths = COALESCE($7::jsonb, photo_paths)
       WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
       RETURNING *`,
      [req.params.id, req.userId, title, body, category,
       contact_id || null,
       photo_paths ? JSON.stringify(photo_paths) : null]
    )
    if (!rows[0]) return res.status(404).json({ error: 'Not found' })
    res.json(rows[0])
  } catch (e) { next(e) }
})

// DELETE /api/notes/:id
router.delete('/:id', async (req, res, next) => {
  try {
    await pool.query(
      `UPDATE notes SET deleted_at = NOW() WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.userId]
    )
    res.json({ ok: true })
  } catch (e) { next(e) }
})

// POST /api/notes/:id/photo — upload photo to a note
router.post('/:id/photo', upload.single('photo'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file' })
    const photoPath = `/uploads/${req.file.filename}`
    await pool.query(
      `UPDATE notes SET photo_paths = photo_paths || $3::jsonb
       WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
      [req.params.id, req.userId, JSON.stringify([photoPath])]
    )
    res.json({ photoPath })
  } catch (e) { next(e) }
})

export default router
