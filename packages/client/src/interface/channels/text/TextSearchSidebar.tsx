import { For, Show, Suspense, createSignal } from "solid-js";

import { Trans } from "@lingui-solid/solid/macro";
import { useQuery } from "@tanstack/solid-query";
import { API, Channel } from "revolt.js";

import { Message } from "@revolt/app";
import { Button, CircularProgress, Row } from "@revolt/ui";

/**
 * Message search sidebar
 */
export function TextSearchSidebar(props: {
  channel: Channel;
  query: Omit<API.DataMessageSearch, "include_users">;
}) {
  const [sort, setSort] = createSignal<API.DataMessageSearch["sort"]>("Latest");

  const query = useQuery(() => ({
    queryKey: ["search", props.channel.id, props.query, sort()],
    queryFn: () =>
      props.channel
        .searchWithUsers(
          props.query.sort
            ? props.query
            : {
                ...props.query,
                sort: sort(),
              },
        )
        .then((result) => result.messages),
  }));

  /**
   * Handle click on search result - store search term for highlighting
   */
  const handleResultClick = (message: any, searchQuery: string) => {
    try {
      // Store the search term and message ID in sessionStorage
      // This will be picked up by MessageHighlighter to highlight the search term
      sessionStorage.setItem('messageSearchTerm', searchQuery);
      sessionStorage.setItem('messageSearchId', message.id);
      
      console.log('Local search - storing search term:', searchQuery, 'for message:', message.id);
    } catch (error) {
      console.debug('Error storing search term:', error);
    }
  };

  return (
    <>
      <Show when={!props.query.sort}>
        <Row justify="stretch">
          <Button
            group="connected-start"
            groupActive={sort() === "Relevance"}
            onPress={() => setSort("Relevance")}
          >
            <Trans>Relevance</Trans>
          </Button>
          <Button
            group="connected"
            groupActive={sort() === "Latest"}
            onPress={() => setSort("Latest")}
          >
            <Trans>Latest</Trans>
          </Button>
          <Button
            group="connected-end"
            groupActive={sort() === "Oldest"}
            onPress={() => setSort("Oldest")}
          >
            <Trans>Oldest</Trans>
          </Button>
        </Row>
      </Show>
      <Suspense fallback={<CircularProgress />}>
        <For each={query.data}>
          {(message) => (
            <a 
              href={message.path}
              onClick={() => handleResultClick(message, props.query.query || '')}
            >
              <Message message={message} isLink />
            </a>
          )}
        </For>
      </Suspense>
    </>
  );
}
