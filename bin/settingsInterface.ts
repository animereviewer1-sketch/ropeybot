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

import * as readline from "readline";
import { readFile, writeFile } from "fs/promises";
import { BotSettings } from "bc-bot";
import { ConfigFile } from "./config";

interface SettingOption {
    key: keyof BotSettings;
    label: string;
    description: string;
    default: boolean;
}

const SETTING_OPTIONS: SettingOption[] = [
    {
        key: "enableAllMods",
        label: "Enable All Mods",
        description:
            "Enable all mod/addon functionality (enables script permissions)",
        default: true,
    },
    {
        key: "allowFullWardrobeAccess",
        label: "Allow Full Wardrobe Access",
        description: "Allow other players to edit all wardrobe settings",
        default: true,
    },
    {
        key: "enableScriptPermissions",
        label: "Enable Script Permissions",
        description:
            "Allow scripts/mods to hide and block items (required for mods)",
        default: true,
    },
    {
        key: "allowPlayerLeashing",
        label: "Allow Player Leashing",
        description: "Permit other players to leash your bot",
        default: true,
    },
    {
        key: "allowRename",
        label: "Allow Rename",
        description: "Allow name/nickname changes",
        default: true,
    },
    {
        key: "itemsAffectExpressions",
        label: "Items Affect Expressions",
        description: "Allow items to modify facial expressions",
        default: true,
    },
    {
        key: "blockBodyCosplay",
        label: "Block Body Cosplay",
        description: "Prevent body cosplay assets from being removed",
        default: false,
    },
    {
        key: "disablePickingLocksOnSelf",
        label: "Disable Picking Locks On Self",
        description: "Prevent self-lock picking",
        default: false,
    },
];

function createInterface(): readline.Interface {
    return readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
}

function question(rl: readline.Interface, query: string): Promise<string> {
    return new Promise((resolve) => {
        rl.question(query, resolve);
    });
}

async function displayMenu(
    settings: BotSettings,
): Promise<"configure" | "save" | "exit"> {
    const rl = createInterface();

    console.log("\n╔════════════════════════════════════════════════════╗");
    console.log("║         Bot Settings Configuration Menu           ║");
    console.log("╚════════════════════════════════════════════════════╝\n");

    console.log("Current Settings:");
    console.log("─────────────────────────────────────────────────────");

    SETTING_OPTIONS.forEach((option, index) => {
        const value = settings[option.key] ?? option.default;
        const status = value ? "✓ ENABLED" : "✗ DISABLED";
        const color = value ? "\x1b[32m" : "\x1b[31m";
        const reset = "\x1b[0m";
        console.log(`${index + 1}. ${option.label}: ${color}${status}${reset}`);
        console.log(`   ${option.description}`);
    });

    console.log("\n─────────────────────────────────────────────────────");
    console.log("\nOptions:");
    console.log("  1-8: Toggle a setting");
    console.log("  [s]ave: Save settings and start bot");
    console.log("  [q]uit: Exit without saving");

    const answer = await question(rl, "\nYour choice: ");
    rl.close();

    const choice = answer.trim().toLowerCase();

    if (choice === "s" || choice === "save") {
        return "save";
    } else if (choice === "q" || choice === "quit") {
        return "exit";
    } else {
        const num = parseInt(choice);
        if (num >= 1 && num <= SETTING_OPTIONS.length) {
            const option = SETTING_OPTIONS[num - 1];
            const currentValue = settings[option.key] ?? option.default;
            settings[option.key] = !currentValue;
        }
        return "configure";
    }
}

export async function runSettingsInterface(
    configPath: string,
): Promise<BotSettings> {
    try {
        const configString = await readFile(configPath, "utf-8");
        const config = JSON.parse(configString) as ConfigFile;

        // Initialize settings with defaults if not present
        const settings: BotSettings = config.botSettings ?? {};

        // Ensure all settings have initial values
        SETTING_OPTIONS.forEach((option) => {
            if (settings[option.key] === undefined) {
                settings[option.key] = option.default;
            }
        });

        let action: "configure" | "save" | "exit" = "configure";

        while (action === "configure") {
            action = await displayMenu(settings);
        }

        if (action === "save") {
            // Save settings to config file
            config.botSettings = settings;
            await writeFile(configPath, JSON.stringify(config, null, 4));
            console.log("\n✓ Settings saved successfully!");
            console.log("Starting bot with configured settings...\n");
            return settings;
        } else {
            console.log("\nExiting without saving changes.");
            process.exit(0);
        }
    } catch (error) {
        console.error("Error loading configuration:", error);
        process.exit(1);
    }
}

export async function promptForSettingsInterface(): Promise<boolean> {
    const rl = createInterface();

    console.log("\n╔════════════════════════════════════════════════════╗");
    console.log("║            RopeyBot Startup                        ║");
    console.log("╚════════════════════════════════════════════════════╝\n");

    const answer = await question(
        rl,
        "Would you like to configure bot settings? (y/N): ",
    );
    rl.close();

    return answer.trim().toLowerCase() === "y";
}
