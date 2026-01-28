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

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import path from "path";
import { createServer } from "http";
import { RopeyBot } from "../main";
import { StateManager } from "./stateManager";
import { createRoutes } from "./routes";
import { setupWebSocket } from "./socketHandler";
import { WebDashboardConfig } from "../config";

export interface WebServer {
    port: number;
    url: string;
    close: () => Promise<void>;
}

export async function startWebServer(
    bot: RopeyBot,
    config: WebDashboardConfig,
): Promise<WebServer> {
    const app = express();
    const server = createServer(app);

    // Middleware
    app.use(cors({ origin: [`http://localhost:${config.port}`] }));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

    // Optional password authentication middleware
    if (config.password) {
        app.use((req, res, next) => {
            const authHeader = req.headers.authorization;
            const providedPassword = authHeader?.split(" ")[1];

            if (providedPassword !== config.password) {
                return res.status(401).json({ error: "Unauthorized" });
            }
            next();
        });
    }

    // Optional IP whitelist
    if (config.allowedIPs && config.allowedIPs.length > 0) {
        app.use((req, res, next) => {
            const clientIP =
                (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
                req.socket.remoteAddress ||
                "";
            
            // Check if client IP matches any allowed IP
            const isAllowed = config.allowedIPs!.some((allowedIP) => {
                // Handle localhost variations
                if ((allowedIP === "localhost" || allowedIP === "127.0.0.1") &&
                    (clientIP.includes("127.0.0.1") || clientIP.includes("::1") || clientIP.includes("localhost"))) {
                    return true;
                }
                // Direct IP match
                return clientIP.includes(allowedIP);
            });

            if (!isAllowed) {
                return res.status(403).json({ error: "Forbidden" });
            }
            next();
        });
    }

    // Create state manager
    const stateManager = new StateManager(bot);

    // Setup routes
    app.use(createRoutes(bot, stateManager));

    // Serve static files
    app.use(express.static(path.join(__dirname, "public")));

    // Catch-all route to serve index.html for SPA (only for non-API routes)
    app.get("*", (req, res, next) => {
        if (req.path.startsWith("/api")) {
            return next();
        }
        res.sendFile(path.join(__dirname, "public", "index.html"));
    });

    // Setup WebSocket
    setupWebSocket(server, stateManager);

    // Start server
    const port = config.port || 3000;
    await new Promise<void>((resolve) => {
        server.listen(port, () => {
            console.log(`Web dashboard available at http://localhost:${port}`);
            resolve();
        });
    });

    return {
        port,
        url: `http://localhost:${port}`,
        close: async () => {
            return new Promise<void>((resolve) => {
                server.close(() => {
                    console.log("Web server closed");
                    resolve();
                });
            });
        },
    };
}
