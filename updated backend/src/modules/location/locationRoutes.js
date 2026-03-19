import express from 'express';
import * as locationController from './locationController.js';

const router = express.Router();

router.get('/sub-cities', locationController.getSubCities);
router.get('/woredas', locationController.getWoredas);

export default router;
