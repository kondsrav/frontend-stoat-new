import { createMemo, createSignal, createResource, For, Show } from "solid-js";
 
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
 * Add a new friend by searching users
 */
export function AddFriendModal(
  props: DialogProps & Modals & { type: "add_friend" },
) {
  const { showError } = useModals();
 
  // Initialize with empty string to prevent garbage values
  const [filter, setFilter] = createSignal("");
  const [sendingRequests, setSendingRequests] = createSignal(new Set<string>());
  const [sentRequests, setSentRequests] = createSignal(new Set<string>());
 
  // Clear any potential garbage values when modal opens
  setFilter("");
  console.log("🚨 AddFriend MODAL DEBUG - Modal opened, filter cleared to:", filter());
 
  // Search users from backend API when filter changes, with fallback to local cache
  const [searchResults] = createResource(
    () => {
      const query = filter().trim();
      return query.length >= 2 ? query : null;
    },
    async (query) => {
      if (!query) return [];
     
      try {
        // Try backend search first
        console.log("Searching for:", query);
        const response = await props.client.api.get(`/users/search`, { query: query, limit: 20 } as any) as any;
        console.log("Backend search response:", response);
        const results = Array.isArray(response)
          ? response
          : Array.isArray(response?.users)
            ? response.users
            : [];
       
        // Return backend results if found
        if (results.length > 0) {
          console.log("Backend search results:", results);
          return results;
        }
      } catch (err) {
        console.error("Backend search failed:", err);
        console.warn("Backend search failed, falling back to local cache:", err);
      }
     
      // Fallback to local client cache search
      const queryLower = query.toLowerCase();
      const localResults = [...props.client.users.values()]
        .filter((user) => user.id !== props.client.user?.id) // Exclude self
        .filter((user) => {
          const dn = user.displayName.toLowerCase();
          const un = user.username.toLowerCase();
          // Check both display name and username
          return dn.includes(queryLower) || un.includes(queryLower);
        })
        .toSorted((a, b) => a.displayName.localeCompare(b.displayName))
        .slice(0, 20); // Limit to 20 results
       
      console.log("Local search results:", localResults);
      console.log("Total users in cache:", props.client.users.size);
      console.log("Current user:", props.client.user?.username);
     
      // If no local results either, return some test data for debugging
      if (localResults.length === 0 && query.length >= 2) {
        console.log("No results found, returning test data");
        return [
          {
            id: "test1",
            username: "testuser",
            discriminator: "0001",
            display_name: "Test User",
            avatar: null
          },
          {
            id: "test2",
            username: "subbu",
            discriminator: "0002",
            display_name: "Subbu Test",
            avatar: null
          }
        ];
      }
     
      return localResults;
    }
  );
 
  const users = createMemo(() => {
    const results = searchResults() || [];
   
    // Filter out current user and existing friends for both backend and local results
    return results.filter((user: any) => {
      const currentUser = props.client.user;
      const userId = user._id || user.id;
      if (userId === currentUser?.id) return false;
     
      // Check if already friends or has pending request
      const clientUser = props.client.users.get(userId);
      return !clientUser || (clientUser.relationship !== "Friend" && clientUser.relationship !== "Outgoing");
    });
  });
 
  async function sendFriendRequest(userId: string) {
    if (sendingRequests().has(userId) || sentRequests().has(userId)) return; // Prevent double-clicking
 
    const newSendingRequests = new Set(sendingRequests());
    newSendingRequests.add(userId);
    setSendingRequests(newSendingRequests);
 
    try {
      // Use the PUT endpoint with user ID instead of POST with username#discriminator
      await props.client.api.put(`/users/${userId}/friend`);
     
      // Remove from sending set and add to sent set after successful request
      const updatedSendingRequests = new Set(sendingRequests());
      updatedSendingRequests.delete(userId);
      setSendingRequests(updatedSendingRequests);
     
      const updatedSentRequests = new Set(sentRequests());
      updatedSentRequests.add(userId);
      setSentRequests(updatedSentRequests);
     
    } catch (err) {
      // Remove from sending set on error
      const updatedSendingRequests = new Set(sendingRequests());
      updatedSendingRequests.delete(userId);
      setSendingRequests(updatedSendingRequests);
     
      showError(err);
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
          value=""
          variant="filled"
          placeholder="Search by username or display name (2+ characters)..."
          autocomplete="off"
          onInput={(e) => {
            const value = e.currentTarget.value;
            console.log("🚨 AddFriend INPUT DEBUG - Raw value:", value);
            // Sanitize input - only allow letters, numbers, spaces, and common username characters
            const sanitized = value.replace(/[^a-zA-Z0-9\s_.-]/g, '');
            console.log("🚨 AddFriend INPUT DEBUG - Sanitized value:", sanitized);
            setFilter(sanitized);
          }}
        />
 
        <Show
          when={filter().length >= 2}
          fallback={
            <div style={{
              padding: "20px",
              "text-align": "center",
              color: "var(--foreground-200)"
            }}>
              <Trans>Type at least 2 letters to search for users</Trans>
            </div>
          }
        >
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
                  const discriminator = user.discriminator || "0001";
                  const avatarUrl = user.avatar?.url || user.animatedAvatarURL;
                 
                  return (
                    <Row
                      align
                      gap="md"
                      style={{
                        padding: "8px 12px",
                        "border-radius": "8px",
                        cursor: sendingRequests().has(userId) ? "not-allowed" : "pointer",
                        background: "var(--background-200)",
                        "justify-content": "space-between"
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
                            @{username}#{discriminator}
                          </span>
                        </Column>
                      </Row>
                      <Button
                        size="sm"
                        onPress={() => sendFriendRequest(userId)}
                        isDisabled={sendingRequests().has(userId) || sentRequests().has(userId)}
                        variant={sentRequests().has(userId) ? "outlined" : "filled"}
                      >
                        {sendingRequests().has(userId)
                          ? <Trans>Sending...</Trans>
                          : sentRequests().has(userId)
                            ? <Trans>Request Sent</Trans>
                            : <Trans>Add Friend</Trans>
                        }
                      </Button>
                    </Row>
                  );
                }}
              </For>
            </Column>
          </Show>
        </Show>
      </Column>
    </Dialog>
  );
}
 
 
