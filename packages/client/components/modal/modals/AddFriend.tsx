import { createMemo, createSignal, createResource, For, Show, onCleanup } from "solid-js";

import { Trans } from "@lingui-solid/solid/macro";
import { t } from "@lingui/core/macro";

import {
  Avatar,
  Button,
  Column,
  Dialog,
  DialogProps,
  Row,
  TextField,
} from "@revolt/ui";

import { useModals } from "..";
import { Modals } from "../types";

/**
 * Add a new friend by searching users in real-time from database
 */
export function AddFriendModal(
  props: DialogProps & Modals & { type: "add_friend" },
) {
  const { showError } = useModals();

  const [filter, setFilter] = createSignal("");
  const [sendingRequests, setSendingRequests] = createSignal(new Set<string>());
  const [sentRequests, setSentRequests] = createSignal(new Set<string>());
  const [searchTimeout, setSearchTimeout] = createSignal<number | null>(null);

  onCleanup(() => {
    const timeout = searchTimeout();
    if (timeout) {
      clearTimeout(timeout);
    }
  });

  // Debounced search signal
  const [debouncedQuery, setDebouncedQuery] = createSignal("");

  // Real-time search from backend database
  const [searchResults] = createResource(
    debouncedQuery,
    async (query) => {
      if (!query || query.length < 2) return [];
      
      console.log("🔍 Searching database for:", query);
      
      try {
        // Call the backend search endpoint
        const response = await props.client.api.get(`/users/search?query=${encodeURIComponent(query)}&limit=20`);
        console.log("✅ Backend response:", response);
        
        const results = Array.isArray(response) ? response : [];
        console.log(`Found ${results.length} users from database`);
        
        return results;
      } catch (err: any) {
        console.error("❌ Backend search failed:", err);
        
        // Fallback to local cache
        const queryLower = query.toLowerCase();
        const localResults = [...props.client.users.values()]
          .filter((user) => {
            if (user.id === props.client.user?.id) return false;
            const dn = (user.displayName || "").toLowerCase();
            const un = (user.username || "").toLowerCase();
            return dn.includes(queryLower) || un.includes(queryLower);
          })
          .sort((a, b) => (a.displayName || a.username).localeCompare(b.displayName || b.username))
          .slice(0, 20);
        
        console.log(`Using local cache: ${localResults.length} users`);
        return localResults;
      }
    }
  );

  const users = createMemo(() => {
    const results = searchResults() || [];
    
    // Filter out current user and existing friends
    return results.filter((user: any) => {
      const userId = user._id || user.id;
      
      if (userId === props.client.user?.id) return false;
      
      // Check if already friends
      const clientUser = props.client.users.get(userId);
      const isFriend = clientUser && (clientUser.relationship === "Friend" || clientUser.relationship === "Outgoing");
      
      return !isFriend;
    });
  });

  async function sendFriendRequest(user: any) {
    const userId = user._id || user.id;
    
    if (sendingRequests().has(userId) || sentRequests().has(userId)) return;

    const newSendingRequests = new Set(sendingRequests());
    newSendingRequests.add(userId);
    setSendingRequests(newSendingRequests);

    try {
      // Get the User object from client to ensure we have discriminator
      const clientUser = props.client.users.get(userId);
      
      if (clientUser) {
        // Use the revolt.js User object's addFriend method
        // This calls POST /users/friend with auto-accept from backend
        await clientUser.addFriend();
      } else {
        // Fallback: construct username#discriminator from search result
        const username = user.username;
        const discriminator = user.discriminator || "0001"; // Default discriminator if not present
        
        await props.client.api.post('/users/friend', {
          username: `${username}#${discriminator}`
        });
      }
      
      const updatedSendingRequests = new Set(sendingRequests());
      updatedSendingRequests.delete(userId);
      setSendingRequests(updatedSendingRequests);
      
      const updatedSentRequests = new Set(sentRequests());
      updatedSentRequests.add(userId);
      setSentRequests(updatedSentRequests);
      
      console.log("✅ Friend request auto-accepted! User is now in friend list");
    } catch (err) {
      const updatedSendingRequests = new Set(sendingRequests());
      updatedSendingRequests.delete(userId);
      setSendingRequests(updatedSendingRequests);
      
      console.error("Failed to send friend request:", err);
      showError(t`Failed to send friend request. Please try again.`);
    }
  }

  function handleInput(value: string) {
    setFilter(value);
    
    // Clear existing timeout
    const currentTimeout = searchTimeout();
    if (currentTimeout) {
      clearTimeout(currentTimeout);
    }
    
    // Debounce search by 300ms
    if (value.length >= 2) {
      const timeoutId = setTimeout(() => {
        setDebouncedQuery(value);
      }, 300) as unknown as number;
      
      setSearchTimeout(timeoutId);
    } else {
      setDebouncedQuery("");
    }
  }

  return (
    <Dialog
      minWidth={420}
      show={props.show}
      onClose={props.onClose}
      title={<Trans>Add a new friend</Trans>}
      actions={[
        { text: <Trans>Close</Trans> },
      ]}
    >
      <Column gap="lg">
        <TextField
          value={filter()}
          variant="filled"
          placeholder="Search by username or display name..."
          autocomplete="off"
          onInput={(e) => {
            handleInput(e.currentTarget.value);
          }}
        />

        <Show when={filter().length >= 2}>
          <Show 
            when={searchResults.loading}
            fallback={
              <Show 
                when={users().length > 0}
                fallback={
                  <div style={{ 
                    padding: "20px", 
                    "text-align": "center", 
                    color: "var(--foreground-200)" 
                  }}>
                    <Trans>No users found matching your search</Trans>
                  </div>
                }
              >
                <Column gap="sm" style={{ "max-height": "300px", "overflow-y": "auto" }}>
                  <For each={users()}>
                    {(user: any) => {
                      const userId = user._id || user.id;
                      const displayName = user.display_name || user.displayName || user.username;
                      const username = user.username;
                      const avatarUrl = user.avatar?.url || user.animatedAvatarURL || user.avatar?._id;
                      
                      return (
                        <Row 
                          align 
                          gap="md" 
                          style={{ 
                            padding: "8px 12px", 
                            "border-radius": "8px",
                            cursor: sendingRequests().has(userId) ? "not-allowed" : "pointer",
                            background: "var(--background-200)",
                            "justify-content": "space-between",
                            transition: "background 0.2s"
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "var(--background-300)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "var(--background-200)";
                          }}
                        >
                          <Row align gap="md">
                            <Avatar
                              src={avatarUrl}
                              fallback={displayName}
                              size={32}
                            />
                            <Column gap="xs">
                              <span style={{ "font-weight": "500" }}>{displayName}</span>
                              <span style={{ "font-size": "0.9em", opacity: "0.7" }}>
                                @{username}
                              </span>
                            </Column>
                          </Row>
                          <Button
                            size="sm"
                            onPress={() => sendFriendRequest(user)}
                            isDisabled={sendingRequests().has(userId) || sentRequests().has(userId)}
                            variant={sentRequests().has(userId) ? "outlined" : "filled"}
                          >
                            {sendingRequests().has(userId) 
                              ? <Trans>Sending...</Trans> 
                              : sentRequests().has(userId)
                                ? <Trans>Added!</Trans>
                                : <Trans>Add Friend</Trans>
                            }
                          </Button>
                        </Row>
                      );
                    }}
                  </For>
                </Column>
              </Show>
            }
          >
            <div style={{ 
              padding: "20px", 
              "text-align": "center", 
              color: "var(--foreground-300)" 
            }}>
              <Trans>Searching...</Trans>
            </div>
          </Show>
        </Show>
        
        <Show when={filter().length < 2}>
          <div style={{ 
            padding: "20px", 
            "text-align": "center", 
            color: "var(--foreground-200)" 
          }}>
            <Trans>Type at least 2 letters to search for users</Trans>
          </div>
        </Show>
      </Column>
    </Dialog>
  );
}
