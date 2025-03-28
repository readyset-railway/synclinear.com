import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../prisma";
import { getLinearWebhook } from "../../../utils/linear";

// POST /api/linear/webhook
export default async function handle(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== "POST") {
        return res.setHeader("Allow", "POST").status(405).send({
            error: "Only POST requests are accepted"
        });
    }

    const { teamId, teamName } = req.body;

    if (!teamId) {
        return res.status(400).send({ error: "Request is missing team ID" });
    } else if (!teamName) {
        return res.status(400).send({ error: "Request is missing team name" });
    }

    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).send({ error: "Request is missing auth token" });
    }

    try {
        // Check for existence of team in DB
        const teamCount: number = await prisma.linearTeam.count({
            where: { teamId: `${teamId}` }
        });

        // Check for existing webhook
        const FORCE_LINEAR_WEBHOOK_EXISTS = process.env.FORCE_LINEAR_WEBHOOK_EXISTS ?? "false";
        if (FORCE_LINEAR_WEBHOOK_EXISTS=="true") {
            return res.status(200).json({
                teamInDB: teamCount > 0,
                webhookExists: true
            });
        }

        const existingWebhook = await getLinearWebhook(token, teamName);

        return res.status(200).json({
            teamInDB: teamCount > 0,
            webhookExists: !!existingWebhook?.id
        });
    } catch (err) {
        console.error(err);
        return res.status(404).send({ error: err });
    }
}

