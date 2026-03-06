import { Router } from 'express';
import { TagModel } from '../models/Tag.js';
import { authenticate } from '../middleware/auth.js';
import { validate, createTagSchema } from '../middleware/validation.js';
import { HttpError } from '../middleware/errorHandler.js';
import { Response, NextFunction } from 'express';

const router = Router();

// Public routes
router.get('/', async (req, res, next) => {
  try {
    const tags = await TagModel.findAll();
    res.json({ tags });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const tag = await TagModel.findById(id);
    
    if (!tag) {
      throw new HttpError(404, 'Tag not found');
    }
    
    res.json({ tag });
  } catch (error) {
    next(error);
  }
});

// Protected routes (admin only for create/update/delete)
router.post('/', authenticate, validate(createTagSchema), async (req, res, next) => {
  try {
    const user = (req as any).user;
    
    if (user?.role !== 'admin') {
      throw new HttpError(403, 'Only admins can create tags');
    }
    
    const tag = await TagModel.create(req.body);
    res.status(201).json({ message: 'Tag created', tag });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const user = (req as any).user;
    
    if (user?.role !== 'admin') {
      throw new HttpError(403, 'Only admins can update tags');
    }
    
    const { id } = req.params;
    const tag = await TagModel.update(id, req.body);
    
    if (!tag) {
      throw new HttpError(404, 'Tag not found');
    }
    
    res.json({ message: 'Tag updated', tag });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const user = (req as any).user;
    
    if (user?.role !== 'admin') {
      throw new HttpError(403, 'Only admins can delete tags');
    }
    
    const { id } = req.params;
    await TagModel.delete(id);
    
    res.json({ message: 'Tag deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
