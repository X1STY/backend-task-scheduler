import db from '../../db.js'
import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const generateAccessToken = (id, full_name, email) => {
    const payload = {
        id,
        full_name,
        email
    }
    return jwt.sign(payload, process.env.JWT_SECRET)
}

class UserController {
    async registerUser(req, res) {
        try {
            const { full_name, email, password } = req.body 
            const uuid = uuidv4()
            const hashPassword = bcrypt.hashSync(password, 7)
            const access_token = generateAccessToken(uuid, full_name, email)
            const user = await db.query(
                'INSERT INTO "user" (full_name, email, password, user_id, access_token) VALUES ($1, $2, $3, $4, $5) RETURNING full_name, email, user_id, access_token',
                [full_name, email, hashPassword, uuid, access_token]
            )
            const defaultSectionId = uuidv4()
            await db.query(
                'INSERT INTO sections (is_public, section_id, title, url) VALUES ($1, $2, $3, $4) RETURNING *',
                [false, defaultSectionId, 'No section', '']
            )
            await db.query(
                'INSERT INTO "access" (section_id, user_id, access_type) VALUES ($1, $2, $3)',
                [defaultSectionId, uuid, 'OWNER']
            )
            return res.json(user.rows[0])
        } catch (error) {
            console.log(error)
        }
    }
    async loginUser(req, res) {
        try {
            const { email, password } = req.body
            const fetchUser = await db.query(
                'SELECT email, password, user_id, access_token, full_name FROM "user" WHERE email like $1',
                [email]
            )
            const user = fetchUser.rows[0]
            if (!user) {
                return res.status(400).json({ message: 'Пользователь не найден' })
            }
            const checkPassword = bcrypt.compareSync(password, user.password)
            if (!checkPassword) {
                return res.status(400).json({ message: 'Введен неверный пароль' })
            }
            delete user.password
            return res.json({
                email: user.email,
                access_token: user.access_token,
                full_name: user.full_name,
                user_id: user.user_id
            })
        } catch (error) {
            console.log(error)
            return res.status(400).json({ message: 'Ошибка авторизации' })
        }
    }
    async deleteUser(req, res) {}
    async updateUser(req, res) {}
    async getUserInfo(req, res) {
        try {
            const access_token = req.headers.access_token
            if (!access_token) {
                return res.status(401).json({ message: 'Не авторизован' })
            }
            const fetchUser = await db.query(
                'SELECT email, password, user_id, access_token, full_name FROM "user" WHERE access_token = $1',
                [access_token]
            )
            const user = fetchUser.rows[0]
            return res.json({
                email: user.email,
                access_token: user.access_token,
                full_name: user.full_name,
                user_id: user.user_id
            })
        } catch (error) {
            console.log(error)
        }
    }
}
export default new UserController()
