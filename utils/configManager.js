import fs from "fs";
import config from "../config.json" with { type: "json" };

/**
 * Runtime configuration manager for the Discord bot
 * Handles live config updates without requiring restarts
 */
class ConfigManager {
  constructor() {
    this.runtime = {
      LOG_CHANNEL_ID: config.LOG_CHANNEL_ID,
      COMMAND_LOGGING_ENABLED: config.COMMAND_LOGGING_ENABLED,
      DM_MONITORING_ENABLED: config.DM_MONITORING_ENABLED,
      TARGET_GUILD_ID: config.TARGET_GUILD_ID,
      IGNORED_ROLE_ID: config.IGNORED_ROLE_ID,
      AUTHORIZED_USER_IDS: config.AUTHORIZED_USER_IDS,
      DM_EXCLUDED_USER_ID: config.DM_EXCLUDED_USER_ID,
      BOT_TOKEN: process.env.BOT_TOKEN
    };
  }

  /**
   * Get a configuration value
   */
  get(key) {
    return this.runtime[key];
  }

  /**
   * Set a configuration value and persist to file
   */
  async set(key, value) {
    this.runtime[key] = value;
    
    try {
      // Update the config file
      const configPath = "/data/data/com.termux/files/home/discorbitsonic/config.json";
      const currentConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
      currentConfig[key] = value;
      fs.writeFileSync(configPath, JSON.stringify(currentConfig, null, 2));
      
      console.log(`Config updated: ${key} = ${value}`);
    } catch (error) {
      console.error(`Failed to persist config change: ${error}`);
      throw error;
    }
  }

  /**
   * Set multiple configuration values at once
   */
  async setMultiple(updates) {
    try {
      // Update runtime values
      Object.keys(updates).forEach(key => {
        this.runtime[key] = updates[key];
      });

      // Persist to file
      const configPath = "/data/data/com.termux/files/home/discorbitsonic/config.json";
      const currentConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
      Object.keys(updates).forEach(key => {
        currentConfig[key] = updates[key];
      });
      fs.writeFileSync(configPath, JSON.stringify(currentConfig, null, 2));
      
      console.log(`Config updated with multiple values:`, updates);
    } catch (error) {
      console.error(`Failed to persist config changes: ${error}`);
      throw error;
    }
  }

  /**
   * Check if user is authorized
   */
  isAuthorized(userId) {
    return this.runtime.AUTHORIZED_USER_IDS.includes(userId.toString());
  }

  /**
   * Check if user is excluded from DM monitoring
   */
  isDMExcluded(userId) {
    return this.runtime.DM_EXCLUDED_USER_ID === userId.toString();
  }
}

// Export singleton instance
export const configManager = new ConfigManager();