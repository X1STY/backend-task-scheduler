import db from '../../db.js'
import { v4 as uuidv4 } from 'uuid'

class EventController {
    async getEvents(req, res) {
        try {
            const access_token = req.headers.access_token
            if (!access_token) {
                return res.status(400).json({
                    message: 'Не авторизован'
                })
            }
            const { start_date, end_date } = req.query
            if (!start_date && !end_date) {
                return res.status(404).json({
                    message: 'Invalid query parametrs'
                })
            }
            const events = await db.query(
                'SELECT * FROM events WHERE date > $2 AND date < $3 AND owner_id = (SELECT user_id FROM "user" WHERE access_token = $1 ORDER BY "date" DESC)',
                [access_token, start_date, end_date]
            )

            return res.json(
                events.rows.sort((a, b) => {
                    const dateComparison = new Date(a.date) - new Date(b.date)
                    if (dateComparison !== 0) {
                        return dateComparison
                    }
                    const timeComparison =
                        new Date(`1970-01-01T${a.time}`) - new Date(`1970-01-01T${b.time}`)
                    return timeComparison
                })
            )
        } catch (error) {
            console.log(error)
        }
    }
    async addEvent(req, res) {
        try {
            const access_token = req.headers.access_token
            if (!access_token) {
                return res.status(400).json({
                    message: 'Не авторизован'
                })
            }
            const { date, time, description, event_group_id_bd } = req.body
            const defaultSectionId = await fetchSection(access_token, 'OWNER', 'No section')
            const event_group_id = uuidv4()
            await createEventGroup(
                date,
                time,
                description,
                'ONE-TIME',
                defaultSectionId.section_id,
                defaultSectionId.user_id,
                event_group_id
            )
            const eventId = uuidv4()
            const event = await addEventToDB(
                date,
                time,
                description,
                eventId,
                defaultSectionId.user_id,
                event_group_id,
                false
            )
            return res.json(event)
        } catch (error) {
            console.log(error)
        }
    }
    async deleteEvent(req, res) {
        try {
            const access_token = req.headers.access_token
            if (!access_token) {
                return res.status(400).json({
                    message: 'Не авторизован'
                })
            }
            const eventId = req.params.id
            const eventGroup = await db.query(
                'DELETE FROM "events" WHERE event_id=$1 RETURNING event_group_id',
                [eventId]
            )
            await deleteEventGroupFun(eventGroup.rows[0].event_group_id, 'ONE-TIME')
            return res.status(200).json({ message: 'DELETED' })
        } catch (error) {
            console.log(error)
        }
    }
    async updateEvent(req, res) {
        try {
            const access_token = req.headers.access_token
            if (!access_token) {
                return res.status(400).json({
                    message: 'Не авторизован'
                })
            }
            const { date, time, description } = req.body
            const eventId = req.params.id
            await db.query(
                'UPDATE "event_groups" SET date=$1, time=$2, description=$3 WHERE event_group_id=(SELECT event_group_id FROM "events" WHERE event_id=$4) AND owner_id=(SELECT user_id FROM "user" WHERE access_token = $5)',
                [date, time, description, eventId, access_token]
            )
            const updatedEvent = await db.query(
                'UPDATE "events" SET date=$1, time=$2, description=$3 WHERE event_id=$4 AND owner_id=(SELECT user_id FROM "user" WHERE access_token = $5) RETURNING *',
                [date, time, description, eventId, access_token]
            )

            res.json(updatedEvent.rows[0])
        } catch (error) {
            console.log(error)
        }
    }
}

export default new EventController()

export const createEventGroup = async (
    date,
    time,
    description,
    reply_type,
    section_id,
    user_id,
    event_group_id
) => {
    const createSection = await db.query(
        'INSERT INTO "event_groups" (date, time, description, replay, section_id, owner_id, event_group_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING event_group_id',
        [date, time, description, reply_type, section_id, user_id, event_group_id]
    )
    return createSection.rows[0]
}

export const addEventToDB = async (
    date,
    time,
    description,
    eventId,
    user_id,
    event_group_id,
    is_replayed
) => {
    const event = await db.query(
        'INSERT INTO "events" (date, time, description, event_id, owner_id, event_group_id, is_replayed) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [date, time, description, eventId, user_id, event_group_id, is_replayed]
    )
    return event.rows[0]
}

export const fetchSection = async (access_token, access_type, section_title) => {
    const defaultSectionId = await db.query(
        'SELECT "access".section_id, user_id FROM "access" INNER JOIN "sections" on "access".section_id = "sections".section_id WHERE access_type like $2 AND user_id = (SELECT user_id FROM "user" WHERE access_token = $1) AND "sections".title=$3',
        [access_token, access_type, section_title]
    ) //При добавление функционала секций, третим параметр прокинуть название полученное из req.body
    return defaultSectionId.rows[0]
}
export const deleteEventGroupFun = async (id, replay_type) => {
    return await db.query('DELETE FROM "event_groups" WHERE replay=$2 AND event_group_id=$1', [
        id,
        replay_type
    ])
}
