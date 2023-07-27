import { Router } from 'express'
export const eventGroupRouter = new Router()
import EventGroupController from '../controllers/event-group.controller.js'

eventGroupRouter.post('/event-group', EventGroupController.addEventGroup)
eventGroupRouter.delete('/event-group/:id', EventGroupController.deleteEventGroup)
eventGroupRouter.patch('/event-group/:id', EventGroupController.editEventGroup)


