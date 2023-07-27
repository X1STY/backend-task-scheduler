import express, { json } from 'express'
import cors from 'cors'
import { userRouter } from './src/routes/user.route.js'
import { eventRouter } from './src/routes/event.route.js'
import { eventGroupRouter } from './src/routes/event-group.route.js'
import 'dotenv/config'


const PORT = process.env.BACKEND_PORT || 1111

const app = express()
app.use(
    cors({
        origin: ['http://localhost:5173']
    })
)
app.use(json())
app.use('/api', userRouter)
app.use('/api', eventRouter)
app.use('/api', eventGroupRouter)

app.listen(PORT, () => {
    console.log(`server has been started on ${PORT} port...`)
})
