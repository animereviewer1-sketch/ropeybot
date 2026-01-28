/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Router } from "express";
import { RopeyBot } from "../main";
import { StateManager } from "./stateManager";
import { writeFile } from "fs/promises";

export function createRoutes(bot: RopeyBot, stateManager: StateManager): Router {
    const router = Router();

    // Get bot and room status
    router.get("/api/status", (req, res) => {
        try {
            const status = stateManager.getBotStatus();
            res.json(status);
        } catch (error) {
            res.status(500).json({ error: "Failed to get status" });
        }
    });

    // Get list of players in room
    router.get("/api/players", (req, res) => {
        try {
            const players = stateManager.getPlayers();
            res.json(players);
        } catch (error) {
            res.status(500).json({ error: "Failed to get players" });
        }
    });

    // Send message as bot
    router.post("/api/message", (req, res) => {
        try {
            const { type, content, target } = req.body;

            if (!content || !type) {
                return res.status(400).json({ error: "Missing type or content" });
            }

            if (type === "Whisper" && !target) {
                return res.status(400).json({ error: "Target required for whisper" });
            }

            bot.connector.SendMessage(type, content, target);
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: "Failed to send message" });
        }
    });

    // Kick player
    router.post("/api/kick", (req, res) => {
        try {
            const { memberNumber } = req.body;

            if (!memberNumber) {
                return res.status(400).json({ error: "Missing memberNumber" });
            }

            bot.connector.chatRoomAdmin({
                Action: "Kick",
                MemberNumber: memberNumber,
            });

            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: "Failed to kick player" });
        }
    });

    // Ban player
    router.post("/api/ban", (req, res) => {
        try {
            const { memberNumber } = req.body;

            if (!memberNumber) {
                return res.status(400).json({ error: "Missing memberNumber" });
            }

            const chatRoom = bot.connector.chatRoom;
            if (chatRoom) {
                const updatedBanList = [...(chatRoom.Ban || []), memberNumber];
                bot.connector.ChatRoomUpdate({
                    Ban: updatedBanList,
                });
            }

            bot.connector.chatRoomAdmin({
                Action: "Ban",
                MemberNumber: memberNumber,
            });

            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: "Failed to ban player" });
        }
    });

    // Get current config
    router.get("/api/config", (req, res) => {
        try {
            const config = stateManager.getConfig();
            res.json(config);
        } catch (error) {
            res.status(500).json({ error: "Failed to get config" });
        }
    });

    // Update config
    router.post("/api/config", async (req, res) => {
        try {
            const { superusers, members, room } = req.body;

            // Update in-memory config
            if (superusers !== undefined) {
                bot.config.superusers = superusers;
            }
            if (members !== undefined) {
                bot.config.members = members;
            }
            if (room !== undefined) {
                // Update room settings
                Object.assign(bot.config.room, room);
                bot.connector.ChatRoomUpdate(room);
            }

            // Save to config.json
            const cfgFile = process.argv[2] ?? "./config.json";
            await writeFile(cfgFile, JSON.stringify(bot.config, null, 4), "utf-8");

            res.json({ success: true });
        } catch (error) {
            console.error("Failed to update config:", error);
            res.status(500).json({ error: "Failed to update config" });
        }
    });

    // Get recent chat messages
    router.get("/api/chat", (req, res) => {
        try {
            const history = stateManager.getChatHistory();
            res.json(history);
        } catch (error) {
            res.status(500).json({ error: "Failed to get chat history" });
        }
    });

    // Get ban list
    router.get("/api/banlist", (req, res) => {
        try {
            const chatRoom = bot.connector.chatRoom;
            const banList = chatRoom?.Ban || [];
            res.json(banList);
        } catch (error) {
            res.status(500).json({ error: "Failed to get ban list" });
        }
    });

    return router;
}
