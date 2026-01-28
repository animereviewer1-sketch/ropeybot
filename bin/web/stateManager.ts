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

import { EventEmitter } from "events";
import { RopeyBot } from "../main";
import { API_Character, BC_Server_ChatRoomMessage } from "bc-bot";

export interface ChatMessage {
    id: string;
    timestamp: number;
    sender: string;
    senderMemberNumber: number;
    type: string;
    content: string;
}

export interface PlayerInfo {
    memberNumber: number;
    name: string;
    isAdmin: boolean;
}

export interface BotStatus {
    connected: boolean;
    game: string;
    roomName: string;
    roomDescription: string;
    roomPrivate: boolean;
    roomLimit: number;
    playerCount: number;
    uptime: number;
    startTime: number;
}

export class StateManager extends EventEmitter {
    private bot: RopeyBot;
    private chatHistory: ChatMessage[] = [];
    private maxChatHistory = 100;
    private startTime: number;

    constructor(bot: RopeyBot) {
        super();
        this.bot = bot;
        this.startTime = Date.now();
        this.setupEventListeners();
    }

    private setupEventListeners() {
        const connector = this.bot.connector;

        // Listen for messages
        connector.on("Message", (message) => {
            this.addChatMessage(message.sender, message.message);
        });

        // Listen for player joins
        connector.on("CharacterEntered", (character) => {
            this.emit("playerJoined", this.getPlayerInfo(character));
        });

        // Listen for player leaves
        connector.on("CharacterLeft", (sourceMemberNumber, character) => {
            this.emit("playerLeft", this.getPlayerInfo(character));
        });
    }

    private addChatMessage(
        sender: API_Character,
        message: BC_Server_ChatRoomMessage,
    ) {
        const chatMsg: ChatMessage = {
            id: `${Date.now()}-${sender.MemberNumber}`,
            timestamp: Date.now(),
            sender: sender.Name,
            senderMemberNumber: sender.MemberNumber,
            type: message.Type,
            content: message.Content,
        };

        this.chatHistory.push(chatMsg);
        if (this.chatHistory.length > this.maxChatHistory) {
            this.chatHistory.shift();
        }

        this.emit("newMessage", chatMsg);
    }

    private getPlayerInfo(character: API_Character): PlayerInfo {
        return {
            memberNumber: character.MemberNumber,
            name: character.Name,
            isAdmin: character.IsRoomAdmin(),
        };
    }

    public getChatHistory(): ChatMessage[] {
        return [...this.chatHistory];
    }

    public getPlayers(): PlayerInfo[] {
        const chatRoom = this.bot.connector.chatRoom;
        if (!chatRoom) {
            return [];
        }

        return chatRoom.characters.map((char) => this.getPlayerInfo(char));
    }

    public getBotStatus(): BotStatus {
        const connector = this.bot.connector;
        const chatRoom = connector.chatRoom;

        return {
            connected: connector.isConnected(),
            game: this.bot.game ?? "none",
            roomName: chatRoom?.Name ?? "Not in room",
            roomDescription: chatRoom
                ? ((chatRoom as any).data?.Description ?? "")
                : "",
            roomPrivate: chatRoom?.Private ?? false,
            roomLimit: chatRoom?.Limit ?? 10,
            playerCount: chatRoom?.characters.length ?? 0,
            uptime: Date.now() - this.startTime,
            startTime: this.startTime,
        };
    }

    public getConfig() {
        return {
            superusers: this.bot.config.superusers,
            members: this.bot.config.members,
            game: this.bot.config.game,
            room: this.bot.config.room,
        };
    }
}
