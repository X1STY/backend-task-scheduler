import { Router } from 'express'
export const sectionRouter = new Router()
import SectionController from '../controllers/section.controller.js'

sectionRouter.get('/sections', SectionController.getSections)
sectionRouter.get('/section/:id', SectionController.getEventsInSection)
