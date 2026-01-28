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

import { WebSocketServer, WebSocket } from "ws";
import { Server as HttpServer } from "http";
import { StateManager } from "./stateManager";

export function setupWebSocket(
    server: HttpServer,
    stateManager: StateManager,
): WebSocketServer {
    const wss = new WebSocketServer({ server, path: "/ws" });

    wss.on("connection", (ws: WebSocket) => {
        console.log("WebSocket client connected");

        // Send initial data
        ws.send(
            JSON.stringify({
                type: "status",
                data: stateManager.getBotStatus(),
            }),
        );
        ws.send(
            JSON.stringify({
                type: "players",
                data: stateManager.getPlayers(),
            }),
        );
        ws.send(
            JSON.stringify({
                type: "chat",
                data: stateManager.getChatHistory(),
            }),
        );

        // Set up event listeners
        const onNewMessage = (message: any) => {
            ws.send(JSON.stringify({ type: "newMessage", data: message }));
        };

        const onPlayerJoined = (player: any) => {
            ws.send(JSON.stringify({ type: "playerJoined", data: player }));
        };

        const onPlayerLeft = (player: any) => {
            ws.send(JSON.stringify({ type: "playerLeft", data: player }));
        };

        const onRoomUpdated = (status: any) => {
            ws.send(JSON.stringify({ type: "status", data: status }));
        };

        stateManager.on("newMessage", onNewMessage);
        stateManager.on("playerJoined", onPlayerJoined);
        stateManager.on("playerLeft", onPlayerLeft);
        stateManager.on("roomUpdated", onRoomUpdated);

        // Send periodic status updates
        const statusInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                try {
                    ws.send(
                        JSON.stringify({
                            type: "status",
                            data: stateManager.getBotStatus(),
                        }),
                    );
                } catch (error) {
                    console.error("Failed to send status update:", error);
                }
            }
        }, 5000);

        ws.on("close", () => {
            console.log("WebSocket client disconnected");
            clearInterval(statusInterval);
            stateManager.off("newMessage", onNewMessage);
            stateManager.off("playerJoined", onPlayerJoined);
            stateManager.off("playerLeft", onPlayerLeft);
            stateManager.off("roomUpdated", onRoomUpdated);
        });

        ws.on("error", (error) => {
            console.error("WebSocket error:", error);
        });
    });

    return wss;
}
