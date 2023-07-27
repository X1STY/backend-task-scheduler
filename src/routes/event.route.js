import { Router } from 'express'
export const eventRouter = new Router()
import EventController from '../controllers/event.controller.js'

eventRouter.post('/event', EventController.addEvent)
eventRouter.get('/events', EventController.getEvents)
eventRouter.patch('/event/:id', EventController.updateEvent)
eventRouter.delete('/event/:id', EventController.deleteEvent)
