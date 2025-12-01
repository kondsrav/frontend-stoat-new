import { Show } from "solid-js";

import { useNavigate } from "@solidjs/router";
import { ServerMember, User } from "revolt.js";
import { styled } from "styled-system/jsx";

import { UserContextMenu } from "@revolt/app";
import { useModals } from "@revolt/modal";

import MdCancel from "@material-design-icons/svg/filled/cancel.svg?component-solid";
import MdEdit from "@material-design-icons/svg/filled/edit.svg?component-solid";
import MdMoreVert from "@material-design-icons/svg/filled/more_vert.svg?component-solid";

import { Button, IconButton } from "../../design";
import { dismissFloatingElements } from "../../floating";
import { iconSize } from "../../utils";

/**
 * Actions shown on profile cards
 */
export function ProfileActions(props: {
  width: 2 | 3;

  user: User;
  member?: ServerMember;
}) {
  const navigate = useNavigate();
  const { openModal } = useModals();

  /**
   * Open direct message channel with auto-friend request handling
   */
  async function handleMessage() {
    try {
      // Skip friend request logic for bots
      if (!props.user.bot) {
        // Handle different relationship states
        if (props.user.relationship === "None") {
          // Send friend request (backend auto-accepts it)
          await props.user.addFriend();
        } else if (props.user.relationship === "Incoming") {
          // They already sent us a request, accept it by calling PUT endpoint
          await props.user.client.api.put(`/users/${props.user.id}/friend`);
        }
        // For "Outgoing" and "Friend", no action needed
      }

      // Now try to open the DM
      const channel = await props.user.openDM();
      navigate(channel.url);
    } catch (error) {
      console.error("Error handling message:", error);
      // Fallback: try to open DM anyway
      try {
        const channel = await props.user.openDM();
        navigate(channel.url);
      } catch (dmError) {
        console.error("Error opening DM:", dmError);
      }
    }
  }

  /**
   * Open edit menu
   */
  function openEdit() {
    if (props.member) {
      openModal({ type: "server_identity", member: props.member });
    } else {
      openModal({ type: "settings", config: "user" });
    }

    dismissFloatingElements();
  }

  return (
    <Actions width={props.width}>
      {/* Show Message button for all users and bots except self */}
      <Show when={!props.user.self}>
        <Button onPress={handleMessage}>Message</Button>
      </Show>

      <Show
        when={
          props.member
            ? props.user.self
              ? props.member.server!.havePermission("ChangeNickname") ||
                props.member.server!.havePermission("ChangeAvatar")
              : (props.member.server!.havePermission("ManageNicknames") ||
                  props.member.server!.havePermission("RemoveAvatars")) &&
                props.member.inferiorTo(props.member!.server!.member!)
            : props.user.self
        }
      >
        <IconButton onPress={openEdit}>
          <MdEdit {...iconSize(16)} />
        </IconButton>
      </Show>

      <IconButton
        use:floating={{
          contextMenu: () => (
            <UserContextMenu user={props.user} member={props.member} />
          ),
          contextMenuHandler: "click",
        }}
      >
        <MdMoreVert />
      </IconButton>
    </Actions>
  );
}

const Actions = styled("div", {
  base: {
    display: "flex",
    gap: "var(--gap-md)",
    justifyContent: "flex-end",
  },
  variants: {
    width: {
      3: {
        gridColumn: "1 / 4",
      },
      2: {
        gridColumn: "1 / 3",
      },
    },
  },
});
