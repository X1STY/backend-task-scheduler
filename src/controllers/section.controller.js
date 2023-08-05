import db from '../../db.js'

class SectionController {
    async getSections(req, res) {
        try {
            const access_token = req.headers.access_token
            if (!access_token) {
                return res.status(400).json({ message: 'Не авторизован' })
            }
            const sections = await db.query(
                'SELECT title, sections.section_id, access.access_type FROM sections LEFT JOIN access ON access.section_id = sections.section_id WHERE access.access_type = $1 AND access.user_id = (SELECT user_id FROM "user" WHERE access_token = $2)',
                ['OWNER', access_token]
            )
            return res.json(sections.rows)
        } catch (error) {
            console.log(error)
        }
    }
    async addSection(req, res) {}
    async getEventsInSection(req, res) {
        try {
            const access_token = req.headers.access_token
            if (!access_token) {
                return res.status(400).json({ message: 'Не авторизован' })
            }
            const section_id = req.params.id
            const events = await db.query(
                'SELECT * FROM events WHERE events.event_group_id in (SELECT event_group_id FROM event_groups INNER JOIN access ON access.section_id = event_groups.section_id WHERE event_groups.section_id = $1 AND access.user_id = (SELECT user_id FROM "user" WHERE access_token = $2))',
                [section_id, access_token]
            )
            return res.json(events.rows)
        } catch (error) {
            console.log(error)
        }
    }
    async deleteSection(req, res) {
        const access_token = req.headers.access_token
        if (!access_token) {
            return res.status(400).json({ message: 'Не авторизован' })
        }
    }
}

export default new SectionController()
