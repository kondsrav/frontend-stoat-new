import { createSignal, For, Show, createMemo } from "solid-js";

import { Trans } from "@lingui-solid/solid/macro";
import { t } from "@lingui/core/macro";
import { Channel, Server } from "revolt.js";

import { useClient } from "@revolt/client";
import { useState } from "@revolt/state";
import {
  Avatar,
  Button,
  Column,
  Dialog,
  DialogProps,
  Row,
  Text,
  TextField,
} from "@revolt/ui";
import { styled } from "styled-system/jsx";

import { useModals } from "..";
import { Modals } from "../types";

/**
 * Message preview container
 */
const MessagePreview = styled("div", {
  base: {
    padding: "12px",
    borderRadius: "8px",
    background: "var(--md-sys-color-surface-container)",
    border: "1px solid var(--md-sys-color-outline-variant)",
    marginBottom: "16px",
  },
});

/**
 * Channel list item
 */
const ChannelItem = styled("div", {
  base: {
    padding: "8px 12px",
    borderRadius: "8px",
    cursor: "pointer",
    background: "transparent",
    border: "1px solid transparent",
    transition: "all 0.2s ease",
    "&[data-selected='true']": {
      background: "var(--md-sys-color-primary-container)",
      borderColor: "var(--md-sys-color-primary)",
    },
    "&:hover": {
      background: "var(--md-sys-color-surface-container-high)",
    },
  },
});

/**
 * Empty state message
 */
const EmptyState = styled("div", {
  base: {
    textAlign: "center",
    opacity: 0.7,
    padding: "20px",
  },
});

/**
 * Forward a message to another chat
 */
export function ForwardMessageModal(
  props: DialogProps & Modals & { type: "forward_message" },
) {
  const client = useClient();
  const state = useState();
  const { showError } = useModals();
  
  const [filter, setFilter] = createSignal("");
  const [selectedChannels, setSelectedChannels] = createSignal<Set<string>>(new Set());
  const [sending, setSending] = createSignal(false);

  // Get all accessible channels for forwarding
  const availableChannels = createMemo(() => {
    const filterText = filter().toLowerCase();
    const channels: Channel[] = [];
    
    // Get DM channels
    client().channels.forEach(channel => {
      if (channel.type === "DirectMessage" && channel.active) {
        const recipient = channel.recipient;
        if (recipient && !recipient.bot && recipient.id !== client().user?.id) {
          if (!filterText || recipient.displayName?.toLowerCase().includes(filterText)) {
            channels.push(channel);
          }
        }
      }
    });

    // Get group channels
    client().channels.forEach(channel => {
      if (channel.type === "Group") {
        if (!filterText || channel.name?.toLowerCase().includes(filterText)) {
          channels.push(channel);
        }
      }
    });

    // Get server text channels
    client().servers.forEach(server => {
      server.channels?.forEach(channel => {
        if (channel.type === "TextChannel" && channel.havePermission("SendMessage")) {
          const serverName = server.name?.toLowerCase() || "";
          const channelName = channel.name?.toLowerCase() || "";
          if (!filterText || 
              channelName.includes(filterText) || 
              serverName.includes(filterText)) {
            channels.push(channel);
          }
        }
      });
    });

    return channels.sort((a, b) => {
      // Sort by type first (DMs, Groups, then Servers), then by name
      const typeOrder = { DirectMessage: 0, Group: 1, TextChannel: 2 };
      const aType = typeOrder[a.type as keyof typeof typeOrder] || 3;
      const bType = typeOrder[b.type as keyof typeof typeOrder] || 3;
      
      if (aType !== bType) return aType - bType;
      
      const aName = getChannelDisplayName(a).toLowerCase();
      const bName = getChannelDisplayName(b).toLowerCase();
      return aName.localeCompare(bName);
    });
  });

  /**
   * Get display name for a channel
   */
  function getChannelDisplayName(channel: Channel): string {
    switch (channel.type) {
      case "DirectMessage":
        return channel.recipient?.displayName || "Unknown User";
      case "Group":
        return channel.name || "Unnamed Group";
      case "TextChannel":
        return `# ${channel.name}`;
      default:
        return "Unknown Channel";
    }
  }

  /**
   * Get icon URL for a channel
   */
  function getChannelIcon(channel: Channel): string | undefined {
    switch (channel.type) {
      case "DirectMessage":
        return channel.recipient?.avatarURL;
      case "Group":
        return channel.iconURL;
      case "TextChannel":
        return channel.server?.iconURL;
      default:
        return undefined;
    }
  }

  /**
   * Get server name for text channels
   */
  function getServerName(channel: Channel): string | undefined {
    if (channel.type === "TextChannel") {
      return channel.server?.name;
    }
    return undefined;
  }

  /**
   * Toggle channel selection
   */
  function toggleChannel(channelId: string) {
    const selected = new Set(selectedChannels());
    if (selected.has(channelId)) {
      selected.delete(channelId);
    } else {
      selected.add(channelId);
    }
    setSelectedChannels(selected);
  }

  /**
   * Forward the message to selected channels
   */
  async function forwardMessage() {
    if (selectedChannels().size === 0 || sending()) return;
    
    setSending(true);
    
    try {
      const forwarded = Array.from(selectedChannels());
      let successCount = 0;
      let errorCount = 0;

      for (const channelId of forwarded) {
        try {
          const channel = client().channels.get(channelId);
          if (channel) {
            // Forward the message content with a "Forwarded from" prefix
            const originalContent = props.message.content || "";
            const forwardedContent = originalContent 
              ? `**Forwarded message:**\n${originalContent}`
              : "**Forwarded message** _(media/attachment)_";

            await channel.sendMessage({
              content: forwardedContent,
              attachments: props.message.attachments?.map(a => a.id),
            });
            successCount++;
          }
        } catch (error) {
          console.error(`Failed to forward to channel ${channelId}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        // Show success message - using a simple method since state.notifications.success might not exist
        console.log(`Message forwarded to ${successCount} chat${successCount > 1 ? 's' : ''}`);
      }

      if (errorCount > 0) {
        showError({
          error: new Error(`Failed to forward to ${errorCount} chat${errorCount > 1 ? 's' : ''}`)
        });
      }

      props.onClose();
    } catch (error) {
      console.error("Error forwarding message:", error);
      showError({ error });
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog
      {...props}
      title={<Trans>Forward Message</Trans>}
      actions={[
        {
          text: <Trans>Cancel</Trans>,
          onClick: props.onClose,
        },
        {
          text: <Trans>Forward to {selectedChannels().size} chat{selectedChannels().size !== 1 ? 's' : ''}</Trans>,
          onClick: forwardMessage,
          isDisabled: selectedChannels().size === 0 || sending(),
        },
      ]}
    >
      <Column gap="md">
        {/* Preview of message being forwarded */}
        <MessagePreview>
          <Text size="small" class="body">
            <Trans>Forwarding message from:</Trans>
          </Text>
          <Row gap="sm">
            <Avatar size={24} src={props.message.avatarURL} />
            <Text class="label">{props.message.username}</Text>
          </Row>
          <div style={{ "margin-top": "8px" }}>
            <Text class="body">
              {props.message.content || <em><Trans>Media message</Trans></em>}
            </Text>
          </div>
        </MessagePreview>

        {/* Search filter */}
        <TextField
          placeholder={t`Search chats...`}
          value={filter()}
          onInput={(event) => setFilter(event.target.value)}
        />

        {/* Channel list */}
        <div style={{ "max-height": "300px", "overflow-y": "auto" }}>
          <Show
            when={availableChannels().length > 0}
            fallback={
              <EmptyState>
                <Text>
                  <Trans>No chats found</Trans>
                </Text>
              </EmptyState>
            }
          >
            <Column gap="xs">
              <For each={availableChannels()}>
                {(channel) => (
                  <ChannelItem
                    data-selected={selectedChannels().has(channel.id)}
                    onClick={() => toggleChannel(channel.id)}
                  >
                    <Row gap="sm">
                      <Avatar size={32} src={getChannelIcon(channel)} />
                      <Column gap="xs" style={{ "flex-grow": 1 }}>
                        <Text class="label">{getChannelDisplayName(channel)}</Text>
                        <Show when={getServerName(channel)}>
                          <Text size="small" class="body">
                            {getServerName(channel)}
                          </Text>
                        </Show>
                      </Column>
                      <Show when={selectedChannels().has(channel.id)}>
                        <div style={{ 
                          width: "20px", 
                          height: "20px", 
                          "border-radius": "50%", 
                          background: "var(--md-sys-color-primary)",
                          display: "flex",
                          "align-items": "center",
                          "justify-content": "center"
                        }}>
                          <Text size="small" class="body">
                            ✓
                          </Text>
                        </div>
                      </Show>
                    </Row>
                  </ChannelItem>
                )}
              </For>
            </Column>
          </Show>
        </div>
      </Column>
    </Dialog>
  );
}

