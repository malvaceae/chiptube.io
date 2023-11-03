// Express
import { Router } from 'express';

// Api Routes
import * as routes from '@/api/routes';

// Express Router
const router = Router();

// Get tunes.
router.get('/tunes', (req, res, next) => {
  routes.tunes.get(req, res).catch(next);
});

// Post the tune.
router.post('/tunes', (req, res, next) => {
  routes.tunes.post(req, res).catch(next);
});

// Get the tune by id.
router.get('/tunes/:id', (req, res, next) => {
  routes.tunes._id.get(req, res).catch(next);
});

// Put the tune by id.
router.put('/tunes/:id', (req, res, next) => {
  routes.tunes._id.put(req, res).catch(next);
});

// Delete the tune by id.
router.delete('/tunes/:id', (req, res, next) => {
  routes.tunes._id.delete(req, res).catch(next);
});

// Get tune comments.
router.get('/tunes/:id/comments', (req, res, next) => {
  routes.tunes._id.comments.get(req, res).catch(next);
});

// Post the tune comment.
router.post('/tunes/:id/comments', (req, res, next) => {
  routes.tunes._id.comments.post(req, res).catch(next);
});

// Get tunes by id.
router.get('/tunes/:id/tunes', (req, res, next) => {
  routes.tunes._id.tunes.get(req, res).catch(next);
});

// Put the user by me.
router.put('/users/me', (req, res, next) => {
  routes.users.me.put(req, res).catch(next);
});

// Post the feedback.
router.post('/feedback', (req, res, next) => {
  routes.feedback.post(req, res).catch(next);
});

// Express Router
export default router;
