import { State } from "..";

import { AbstractStore } from ".";

/**
 * Favorites data structure
 */
interface FavoritesDefinition {
  /**
   * Array of favorited channel IDs
   */
  channels: string[];

  /**
   * Array of favorited server IDs
   */
  servers: string[];
}

/**
 * Default values for favorites
 */
const DEFAULT_VALUES: FavoritesDefinition = {
  channels: [],
  servers: [],
};

/**
 * Favorites store for managing user's favorite channels and groups
 */
export class Favorites extends AbstractStore<"favorites", FavoritesDefinition> {
  /**
   * Construct store
   * @param state State
   */
  constructor(state: State) {
    super(state, "favorites");
  }

  /**
   * Hydrate external context
   */
  hydrate(): void {
    /** nothing needs to be done */
  }

  /**
   * Generate default values
   */
  default(): FavoritesDefinition {
    return { ...DEFAULT_VALUES };
  }

  /**
   * Validate the given data to see if it is compliant and return a compliant object
   */
  clean(input: Partial<FavoritesDefinition>): FavoritesDefinition {
    const favorites: FavoritesDefinition = this.default();

    if (input.channels && Array.isArray(input.channels)) {
      // Filter out invalid channel IDs (should be strings)
      favorites.channels = input.channels.filter(
        (id) => typeof id === "string" && id.length > 0,
      );
    }

    if (input.servers && Array.isArray(input.servers)) {
      // Filter out invalid server IDs (should be strings)
      favorites.servers = input.servers.filter(
        (id) => typeof id === "string" && id.length > 0,
      );
    }

    return favorites;
  }

  /**
   * Get all favorited channels
   * @returns Array of channel IDs
   */
  getFavoriteChannels(): string[] {
    return (this.get() as FavoritesDefinition).channels || [];
  }

  /**
   * Check if a channel is favorited
   * @param channelId Channel ID to check
   * @returns Whether the channel is favorited
   */
  isFavorited(channelId: string): boolean {
    return this.getFavoriteChannels().includes(channelId);
  }

  /**
   * Add a channel to favorites
   * @param channelId Channel ID to add
   */
  addToFavorites(channelId: string): void {
    const current = this.getFavoriteChannels();
    if (!current.includes(channelId)) {
      this.set("channels", [...current, channelId]);
    }
  }

  /**
   * Remove a channel from favorites
   * @param channelId Channel ID to remove
   */
  removeFromFavorites(channelId: string): void {
    const current = this.getFavoriteChannels();
    this.set("channels", current.filter((id) => id !== channelId));
  }

  /**
   * Toggle favorite status of a channel
   * @param channelId Channel ID to toggle
   */
  toggleFavorite(channelId: string): void {
    if (this.isFavorited(channelId)) {
      this.removeFromFavorites(channelId);
    } else {
      this.addToFavorites(channelId);
    }
  }

  /**
   * Clear all favorites
   */
  clearFavorites(): void {
    this.set("channels", []);
  }

  /**
   * Get all favorited servers
   * @returns Array of server IDs
   */
  getFavoriteServers(): string[] {
    return (this.get() as FavoritesDefinition).servers || [];
  }

  /**
   * Check if a server is favorited
   * @param serverId Server ID to check
   * @returns Whether the server is favorited
   */
  isServerFavorited(serverId: string): boolean {
    return this.getFavoriteServers().includes(serverId);
  }

  /**
   * Add a server to favorites
   * @param serverId Server ID to add
   */
  addServerToFavorites(serverId: string): void {
    const current = this.getFavoriteServers();
    if (!current.includes(serverId)) {
      this.set("servers", [...current, serverId]);
    }
  }

  /**
   * Remove a server from favorites
   * @param serverId Server ID to remove
   */
  removeServerFromFavorites(serverId: string): void {
    const current = this.getFavoriteServers();
    this.set("servers", current.filter((id) => id !== serverId));
  }

  /**
   * Toggle favorite status of a server
   * @param serverId Server ID to toggle
   */
  toggleServerFavorite(serverId: string): void {
    if (this.isServerFavorited(serverId)) {
      this.removeServerFromFavorites(serverId);
    } else {
      this.addServerToFavorites(serverId);
    }
  }

  /**
   * Clear all server favorites
   */
  clearServerFavorites(): void {
    this.set("servers", []);
  }
}

/**
 * Export the type for use in other stores
 */
export type TypeFavorites = FavoritesDefinition;