import db from '../../db.js'
import { v4 as uuidv4 } from 'uuid'
import {
    createEventGroup,
    fetchSection,
    addEventToDB,
    deleteEventGroupFun
} from './event.controller.js'

class EventGroupController {
    async addEventGroup(req, res) {
        try {
            const { date, time, description, replay } = req.body
            const access_token = req.headers.access_token
            if (!access_token) {
                return res.status(400).json({ message: 'Не авторизован' })
            }
            const defaultSectionId = await fetchSection(access_token, 'OWNER', 'No section')
            const event_group_id = uuidv4()

            let start = new Date(replay.start_date).getTime()
            let end = new Date(replay.end_date).getTime()

            if (start > end) {
                let temp = start
                start = end
                end = temp
            }

            const startDate = new Date(start)
            console.log(startDate)
            switch (replay.replay_type) {
                case 'DAILY': {
                    await createEventGroup(
                        date,
                        time,
                        description,
                        'DAILY',
                        defaultSectionId.section_id,
                        defaultSectionId.user_id,
                        event_group_id
                    )
                    const dateDiff = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24))
                    let j = 0
                    for (let i = 0; i <= dateDiff; i++) {
                        const event = await addEventToDB(
                            new Date(startDate.setDate(startDate.getDate() + j)),
                            time,
                            description,
                            uuidv4(),
                            defaultSectionId.user_id,
                            event_group_id,
                            true
                        )
                        j = 1
                    }
                    break
                }
                case 'WEEKLY': {
                    await createEventGroup(
                        date,
                        time,
                        description,
                        'WEEKLY',
                        defaultSectionId.section_id,
                        defaultSectionId.user_id,
                        event_group_id
                    )
                    const diffWeeks = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24 * 7))
                    let j = 0
                    for (let i = 0; i <= diffWeeks; i++) {
                        const event = await addEventToDB(
                            new Date(startDate.setDate(startDate.getDate() + j * 7)),
                            time,
                            description,
                            uuidv4(),
                            defaultSectionId.user_id,
                            event_group_id,
                            true
                        )
                        j = 1
                    }
                    break
                }
                case 'MONTHLY': {
                    await createEventGroup(
                        date,
                        time,
                        description,
                        'MONTHLY',
                        defaultSectionId.section_id,
                        defaultSectionId.user_id,
                        event_group_id
                    )
                    const diffMonths = Math.abs(
                        new Date(end).getMonth() - new Date(start).getMonth()
                    )
                    let j = 0
                    for (let i = 0; i <= diffMonths; i++) {
                        const event = await addEventToDB(
                            new Date(startDate.setMonth(startDate.getMonth() + j)),
                            time,
                            description,
                            uuidv4(),
                            defaultSectionId.user_id,
                            event_group_id,
                            true
                        )
                        j = 1
                    }
                    break
                }
                case 'YEARLY': {
                    await createEventGroup(
                        date,
                        time,
                        description,
                        'MONTHLY',
                        defaultSectionId.section_id,
                        defaultSectionId.user_id,
                        event_group_id
                    )
                    const diffMonths = Math.abs(
                        new Date(end).getFullYear() - new Date(start).getFullYear()
                    )
                    let j = 0
                    for (let i = 0; i <= diffMonths; i++) {
                        const event = await addEventToDB(
                            new Date(startDate.setMonth(startDate.getFullYear() + j)),
                            time,
                            description,
                            uuidv4(),
                            defaultSectionId.user_id,
                            event_group_id,
                            true
                        )
                        j = 1
                    }
                    break
                }
                default: {
                    return res.status(400).json({ message: 'Invalid replay type' })
                }
            }
            return res.status(200).json({ message: 'OK' })
        } catch (error) {
            console.log(error)
        }
    }
    async deleteEventGroup(req, res) {
        try {
            const access_token = req.headers.access_token
            if (!access_token) {
                return res.status(400).json({ message: 'Не авторизован' })
            }
            const event_group_id = req.params.id
            const replay_type = await db.query(
                'SELECT replay FROM "event_groups" WHERE event_group_id = $1',
                [event_group_id]
            )
            await deleteEventGroupFun(event_group_id, replay_type.rows[0].replay)
            return res.status(200).json({ message: 'DELETED' })
        } catch (error) {
            console.log(error)
        }
    }
    async editEventGroup(req, res) {
        try {
            const access_token = req.headers.access_token
            if (!access_token) {
                return res.status(400).json({ message: 'Не авторизован' })
            }
            const { time, description } = req.body
            const event_group_id = req.params.id
            const updatedEvent = await db.query(
                'UPDATE "events" SET time=$2, description=$3 WHERE event_group_id=$4 AND owner_id=(SELECT user_id FROM "user" WHERE access_token = $1) RETURNING *',
                [access_token, time, description, event_group_id]
            )
            const updatedEventGroup = await db.query(
                'UPDATE "event_groups" SET time=$2, description=$3 WHERE event_group_id=$4 AND owner_id=(SELECT user_id FROM "user" WHERE access_token = $1) RETURNING * ',
                [access_token, time, description, event_group_id]
            )
            res.json(updatedEventGroup.rows[0])
        } catch (error) {
            console.log(error)
        }
    }
}
export default new EventGroupController()
