import { createSignal, createMemo, For, Show, createResource, onCleanup } from "solid-js";
import { useNavigate } from "@solidjs/router";

import { Trans } from "@lingui-solid/solid/macro";
import { t } from "@lingui/core/macro";
import { Channel, User, Message, Server } from "revolt.js";

import { useClient } from "@revolt/client";
import { useState } from "@revolt/state";
import {
  Avatar,
  Button,
  Column,
  Row,
  Text,
  TextField,
} from "@revolt/ui";
import { styled } from "styled-system/jsx";

import { iconSize } from "@revolt/ui";

import MdSearch from "@material-design-icons/svg/outlined/search.svg?component-solid";
import MdClose from "@material-design-icons/svg/outlined/close.svg?component-solid";
import MdMessage from "@material-design-icons/svg/outlined/message.svg?component-solid";
import MdPerson from "@material-design-icons/svg/outlined/person.svg?component-solid";
import MdGroup from "@material-design-icons/svg/outlined/group.svg?component-solid";
import MdTag from "@material-design-icons/svg/outlined/tag.svg?component-solid";

/**
 * Main search container
 */
const SearchContainer = styled("div", {
  base: {
    position: "relative",
    width: "450px",
    maxWidth: "500px",
  },
});

/**
 * Search results dropdown
 */
const SearchResults = styled("div", {
  base: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    background: "var(--md-sys-color-surface-container)",
    border: "1px solid var(--md-sys-color-outline-variant)",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    maxHeight: "400px",
    overflowY: "auto",
    zIndex: 1000,
    marginTop: "4px",
  },
});

/**
 * Search result item
 */
const SearchItem = styled("div", {
  base: {
    padding: "8px 12px",
    cursor: "pointer",
    borderBottom: "1px solid var(--md-sys-color-outline-variant)",
    transition: "background 0.2s ease",
    color: "var(--md-sys-color-on-surface)",
    "&:hover": {
      background: "var(--md-sys-color-surface-container-high)",
    },
    "&:last-child": {
      borderBottom: "none",
    },
  },
});

/**
 * Search category header
 */
const CategoryHeader = styled("div", {
  base: {
    padding: "8px 12px",
    background: "var(--md-sys-color-surface-container-low)",
    fontWeight: 600,
    fontSize: "0.75em",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    color: "var(--md-sys-color-on-surface-variant)",
  },
});

/**
 * Highlighted text component for search results
 */
const HighlightedText = styled("mark", {
  base: {
    background: "var(--md-sys-color-tertiary-container)",
    color: "var(--md-sys-color-on-tertiary-container)",
    padding: "1px 2px",
    borderRadius: "2px",
    fontWeight: 600,
  },
});

/**
 * Search result types
 */
type SearchResultType = "user" | "channel" | "server" | "message";

interface SearchResult {
  type: SearchResultType;
  id: string;
  title: string;
  subtitle?: string;
  avatarUrl?: string;
  onClick: () => void;
  highlightedTitle?: any;
}

interface Props {
  /**
   * Whether to show the search input
   */
  isVisible?: boolean;
  
  /**
   * Callback when search is closed
   */
  onClose?: () => void;
}

/**
 * Check if a string looks like a channel ID (alphanumeric without spaces)
 * Channel IDs are typically 6-26 characters of base64-like strings
 */
function looksLikeChannelId(str: string | undefined): boolean {
  if (!str) return false;
  // Check if string is 6-26 chars and contains only alphanumeric characters (no spaces or special chars except underscore/hyphen)
  return /^[a-zA-Z0-9_-]{6,26}$/.test(str) && !/\s/.test(str);
}

/**
 * Get a safe channel name, replacing channel IDs with fallback text
 */
function getSafeChannelName(channel: Channel, fallback: string): string {
  const name = channel.name;
  // If name looks like a channel ID, use the fallback instead
  if (!name || looksLikeChannelId(name)) {
    return fallback;
  }
  return name;
}

/**
 * Highlight search term in text
 */
function highlightText(text: string, query: string) {
  if (!query || !text) return text;
  
  const parts: any[] = [];
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  let lastIndex = 0;
  let index = lowerText.indexOf(lowerQuery);
  
  while (index !== -1) {
    if (index > lastIndex) {
      parts.push(text.substring(lastIndex, index));
    }
    parts.push(
      <HighlightedText>{text.substring(index, index + query.length)}</HighlightedText>
    );
    lastIndex = index + query.length;
    index = lowerText.indexOf(lowerQuery, lastIndex);
  }
  
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  
  return parts;
}

/**
 * Global search component similar to Teams/Slack
 */
export function GlobalSearch(props: Props) {
  const client = useClient();
  const state = useState();
  const navigate = useNavigate();
  
  const [query, setQuery] = createSignal("");
  const [isOpen, setIsOpen] = createSignal(false);
  const [searchTimeout, setSearchTimeout] = createSignal<number | null>(null);

  onCleanup(() => {
    const currentTimeout = searchTimeout();
    if (currentTimeout) {
      clearTimeout(currentTimeout);
    }
  });

  const [debouncedQuery, setDebouncedQuery] = createSignal("");

  const [searchResults] = createResource(
    () => {
      const q = debouncedQuery().trim();
      return q.length >= 2 ? q : null;
    },
    async (searchQuery) => {
      if (!searchQuery) return [];
      
      const results: SearchResult[] = [];
      const queryLower = searchQuery.toLowerCase();

      // Search users/DMs
      client().users.forEach(user => {
        if (user.id === client().user?.id) return;
        
        const displayName = user.displayName?.toLowerCase() || "";
        const username = user.username?.toLowerCase() || "";
        
        if (displayName.includes(queryLower) || username.includes(queryLower)) {
          const dmChannel = client().channels.find(ch => 
            ch.type === "DirectMessage" && ch.recipient?.id === user.id
          );
          
          const title = user.displayName || user.username;
          results.push({
            type: "user",
            id: user.id,
            title: title,
            highlightedTitle: highlightText(title, searchQuery),
            subtitle: user.username !== user.displayName ? `@${user.username}` : undefined,
            avatarUrl: user.avatarURL,
            onClick: () => {
              if (dmChannel) {
                navigate(`/channel/${dmChannel.id}`);
              } else {
                user.openDM().then(channel => {
                  navigate(`/channel/${channel.id}`);
                });
              }
              closeSearch();
            },
          });
        }
      });

      // Search channels
      client().channels.forEach(channel => {
        const channelName = channel.name?.toLowerCase() || "";
        
        if (channelName.includes(queryLower)) {
          let title = "";
          let subtitle = "";
          
          switch (channel.type) {
            case "Group":
              title = getSafeChannelName(channel, "Unnamed Group");
              subtitle = `Group • ${channel.recipients?.length || 0} members`;
              break;
            case "TextChannel":
              title = `# ${getSafeChannelName(channel, "unnamed")}`;
              subtitle = channel.server?.name || "Unknown Server";
              break;
            default:
              return;
          }
          
          results.push({
            type: "channel",
            id: channel.id,
            title: title,
            highlightedTitle: highlightText(title, searchQuery),
            subtitle,
            avatarUrl: channel.iconURL || channel.server?.iconURL,
            onClick: () => {
              if (channel.server) {
                navigate(`/server/${channel.server.id}/channel/${channel.id}`);
              } else {
                navigate(`/channel/${channel.id}`);
              }
              closeSearch();
            },
          });
        }
      });

      // Search servers
      client().servers.forEach(server => {
        const serverName = server.name?.toLowerCase() || "";
        
        if (serverName.includes(queryLower)) {
          const title = server.name || "Unnamed Server";
          results.push({
            type: "server",
            id: server.id,
            title: title,
            highlightedTitle: highlightText(title, searchQuery),
            subtitle: `Server • ${server.channels?.length || 0} channels`,
            avatarUrl: server.iconURL,
            onClick: () => {
              navigate(`/server/${server.id}`);
              closeSearch();
            },
          });
        }
      });

      // Search messages
      try {
        const messageSearchPromises: Promise<void>[] = [];
        
        const accessibleChannels = Array.from(client().channels.values())
          .filter(channel => 
            (channel.type === "TextChannel" || channel.type === "Group" || channel.type === "DirectMessage") &&
            channel.id &&
            !channel.id.startsWith("temp_")
          )
          .slice(0, 15);
        
        for (const channel of accessibleChannels) {
          const searchPromise = channel.search({
            query: searchQuery,
            limit: 5,
            sort: "Relevance"
          }).then(messages => {
            if (messages && Array.isArray(messages)) {
              messages.forEach(message => {
                if (!message || !message.content) return;
                
                let channelName = "";
                let channelContext = "";
                
                try {
                  if (channel.type === "TextChannel") {
                    channelName = `# ${getSafeChannelName(channel, "unknown")}`;
                    channelContext = channel.server?.name || "Unknown Server";
                  } else if (channel.type === "Group") {
                    channelName = getSafeChannelName(channel, "Unnamed Group");
                    channelContext = "Group Chat";
                  } else if (channel.type === "DirectMessage") {
                    channelName = channel.recipient?.displayName || channel.recipient?.username || "Direct Message";
                    channelContext = "Direct Message";
                  }
                  
                  const content = message.content || "";
                  const queryIndex = content.toLowerCase().indexOf(queryLower);
                  let snippet = content;
                  
                  if (queryIndex !== -1 && content.length > 80) {
                    const contextBefore = 40;
                    const contextAfter = 60;
                    const start = Math.max(0, queryIndex - contextBefore);
                    const end = Math.min(content.length, queryIndex + queryLower.length + contextAfter);
                    snippet = (start > 0 ? "..." : "") + content.substring(start, end) + (end < content.length ? "..." : "");
                  } else if (content.length > 80) {
                    snippet = content.substring(0, 80) + "...";
                  }
                  
                  results.push({
                    type: "message",
                    id: message.id,
                    title: snippet,
                    highlightedTitle: highlightText(snippet, searchQuery),
                    subtitle: `${message.author?.displayName || message.author?.username || "Unknown"} in ${channelName} • ${channelContext}`,
                    avatarUrl: message.author?.avatarURL,
                    onClick: () => {
                      try {
                        sessionStorage.setItem('messageSearchTerm', searchQuery);
                        sessionStorage.setItem('messageSearchId', message.id);
                        
                        if (channel.type === "TextChannel" && channel.server) {
                          navigate(`/server/${channel.server.id}/channel/${channel.id}/${message.id}`);
                        } else {
                          navigate(`/channel/${channel.id}/${message.id}`);
                        }
                        closeSearch();
                      } catch (navError) {
                        console.warn("Failed to navigate to message:", navError);
                        closeSearch();
                      }
                    },
                  });
                } catch (processError) {
                  console.debug("Failed to process message result:", processError);
                }
              });
            }
          }).catch(error => {
            console.debug(`Search failed for channel ${channel.id}:`, error.message || error);
          });
          
          messageSearchPromises.push(searchPromise);
        }
        
        await Promise.allSettled(messageSearchPromises);
      } catch (error) {
        console.debug("Message search error (non-critical):", error);
      }

      return results.sort((a, b) => {
        const typeOrder = { user: 0, channel: 1, server: 2, message: 3 };
        const aOrder = typeOrder[a.type];
        const bOrder = typeOrder[b.type];
        
        if (aOrder !== bOrder) return aOrder - bOrder;
        return a.title.localeCompare(b.title);
      });
    }
  );

  function getResultIcon(type: SearchResultType) {
    switch (type) {
      case "user":
        return MdPerson;
      case "channel":
        return MdTag;
      case "server":
        return MdGroup;
      case "message":
        return MdMessage;
      default:
        return MdSearch;
    }
  }

  function getCategoryName(type: SearchResultType) {
    switch (type) {
      case "user":
        return t`People`;
      case "channel":
        return t`Channels`;
      case "server":
        return t`Servers`;
      case "message":
        return t`Messages`;
      default:
        return t`Results`;
    }
  }

  const groupedResults = createMemo(() => {
    const results = searchResults() || [];
    const grouped: Record<SearchResultType, SearchResult[]> = {
      user: [],
      channel: [],
      server: [],
      message: [],
    };

    results.forEach(result => {
      grouped[result.type].push(result);
    });

    return grouped;
  });

  function closeSearch() {
    const currentTimeout = searchTimeout();
    if (currentTimeout) {
      clearTimeout(currentTimeout);
      setSearchTimeout(null);
    }
    setQuery("");
    setDebouncedQuery("");
    setIsOpen(false);
    props.onClose?.();
  }

  function onFocus() {
    setIsOpen(true);
  }

  function onBlur() {
    setTimeout(() => {
      setIsOpen(false);
    }, 200);
  }

  function onInput(event: Event) {
    const target = event.target as HTMLInputElement;
    const newQuery = target.value;
    setQuery(newQuery);
    setIsOpen(true);
    
    const currentTimeout = searchTimeout();
    if (currentTimeout) {
      clearTimeout(currentTimeout);
    }
    
    const timeoutId = setTimeout(() => {
      setDebouncedQuery(newQuery);
    }, 300) as unknown as number;
    
    setSearchTimeout(timeoutId);
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      closeSearch();
    }
  }

  return (
    <Show when={props.isVisible !== false}>
      <SearchContainer>
        <TextField
          placeholder=""
          value={query()}
          onInput={onInput}
          onFocus={onFocus}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
          style={{
            "padding-left": "38px",
            "padding-right": query() ? "36px" : "10px",
            "height": "36px",
            "font-size": "0.9rem",
          }}
        />
        
        <div style={{
          position: "absolute",
          left: "10px",
          top: "50%",
          transform: "translateY(-50%)",
          color: "var(--md-sys-color-on-surface-variant)",
          "pointer-events": "none",
        }}>
          <MdSearch {...iconSize(18)} />
        </div>

        <Show when={query()}>
          <button
            onClick={closeSearch}
            style={{
              position: "absolute",
              right: "6px",
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px",
              "border-radius": "4px",
              color: "var(--md-sys-color-on-surface-variant)",
              display: "flex",
              "align-items": "center",
              "justify-content": "center",
            }}
          >
            <MdClose {...iconSize(16)} />
          </button>
        </Show>

        <Show when={isOpen() && query().length >= 2}>
          <SearchResults>
            <Show
              when={(searchResults() || []).length > 0}
              fallback={
                <SearchItem style={{ "text-align": "center", opacity: 0.7 }}>
                  <Text><Trans>No results found</Trans></Text>
                </SearchItem>
              }
            >
              <For each={Object.entries(groupedResults()) as [SearchResultType, SearchResult[]][]}>
                {([type, results]) => (
                  <Show when={results.length > 0}>
                    <CategoryHeader>
                      {getCategoryName(type)}
                    </CategoryHeader>
                    <For each={results}>
                      {(result) => (
                        <SearchItem onClick={result.onClick}>
                          <Row gap="sm" align="start">
                            <Show
                              when={result.avatarUrl}
                              fallback={
                                <div style={{
                                  width: "32px",
                                  height: "32px",
                                  "min-width": "32px",
                                  "border-radius": "50%",
                                  background: "var(--md-sys-color-primary-container)",
                                  display: "flex",
                                  "align-items": "center",
                                  "justify-content": "center",
                                  color: "var(--md-sys-color-on-primary-container)",
                                }}>
                                  {getResultIcon(result.type)({ ...iconSize(18) })}
                                </div>
                              }
                            >
                              <Avatar size={32} src={result.avatarUrl} />
                            </Show>
                            <Column gap="xs" style={{ "flex-grow": 1, "min-width": 0 }}>
                              <Text class="label" style={{ "word-break": "break-word" }}>
                                {result.highlightedTitle || result.title}
                              </Text>
                              <Show when={result.subtitle}>
                                <Text size="small" class="body" style={{ opacity: 0.7 }}>
                                  {result.subtitle}
                                </Text>
                              </Show>
                            </Column>
                          </Row>
                        </SearchItem>
                      )}
                    </For>
                  </Show>
                )}
              </For>
            </Show>
          </SearchResults>
        </Show>
      </SearchContainer>
    </Show>
  );
}
