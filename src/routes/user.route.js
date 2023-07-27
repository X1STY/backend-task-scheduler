import { Router } from 'express'
export const userRouter = new Router()
import userController from '../controllers/user.controller.js'

userRouter.post('/signup', userController.registerUser)
userRouter.post('/login', userController.loginUser)
userRouter.get('/user', userController.getUserInfo)
userRouter.patch('/user', userController.updateUser)
userRouter.delete('/user', userController.deleteUser)
