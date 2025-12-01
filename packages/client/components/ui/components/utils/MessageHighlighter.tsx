import { styled } from "styled-system/jsx";
import { createSignal, onMount, onCleanup } from "solid-js";

/**
 * Highlighted text span for search results
 */
const Highlight = styled("mark", {
  base: {
    background: "var(--md-sys-color-tertiary-container)",
    color: "var(--md-sys-color-on-tertiary-container)",
    padding: "2px 4px",
    borderRadius: "4px",
    fontWeight: 600,
    boxShadow: "0 0 0 2px var(--md-sys-color-tertiary)",
  },
});

/**
 * Highlight search term in message content
 * @param text The message text to search in
 * @param searchTerm The term to highlight
 * @returns JSX elements with highlighted matches
 */
export function highlightMessageText(text: string, searchTerm: string): any {
  if (!searchTerm || !text) return text;
  
  const parts: any[] = [];
  const lowerText = text.toLowerCase();
  const lowerSearch = searchTerm.toLowerCase();
  let lastIndex = 0;
  let index = lowerText.indexOf(lowerSearch);
  
  // Find all occurrences of the search term
  while (index !== -1) {
    // Add text before match
    if (index > lastIndex) {
      parts.push(text.substring(lastIndex, index));
    }
    
    // Add highlighted match
    parts.push(
      <Highlight>{text.substring(index, index + searchTerm.length)}</Highlight>
    );
    
    lastIndex = index + searchTerm.length;
    index = lowerText.indexOf(lowerSearch, lastIndex);
  }
  
  // Add remaining text after last match
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  
  return parts.length > 0 ? parts : text;
}

/**
 * Hook to get search term from session storage and manage highlighting
 * @param messageId The ID of the current message
 * @returns A signal containing the search term (if this message should be highlighted)
 */
export function useMessageSearchHighlight(messageId: string) {
  const [searchTerm, setSearchTerm] = createSignal<string>("");

  onMount(() => {
    try {
      const storedSearchId = sessionStorage.getItem('messageSearchId');
      const storedSearchTerm = sessionStorage.getItem('messageSearchTerm');

      // Only highlight if this is the message that was clicked in search results
      if (storedSearchId === messageId && storedSearchTerm) {
        setSearchTerm(storedSearchTerm);

        // Scroll to this message smoothly and add background highlight
        setTimeout(() => {
          const element = document.getElementById(`message-${messageId}`);
          if (element) {
            element.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
              inline: 'nearest'
            });

            // Add persistent background highlight to the message container
            element.style.transition = 'background-color 0.3s ease';
            element.style.backgroundColor = 'var(--md-sys-color-surface-container-high)';
          }
        }, 300);

        // Clear both background and search term highlight when user clicks anywhere
        const handleClick = (event: MouseEvent) => {
          // Don't clear if clicking on the highlighted message itself
          const target = event.target as HTMLElement;
          const messageElement = document.getElementById(`message-${messageId}`);

          if (messageElement && !messageElement.contains(target)) {
            // Remove background highlight
            if (messageElement) {
              messageElement.style.backgroundColor = '';
            }

            // Clear search term highlight
            clearSearchHighlight();
            setSearchTerm("");
            document.removeEventListener('click', handleClick);
          }
        };

        // Add click listener after a short delay to avoid immediate trigger
        setTimeout(() => {
          document.addEventListener('click', handleClick);
        }, 500);

        // Clean up listener on component unmount
        onCleanup(() => {
          document.removeEventListener('click', handleClick);
        });
      }
    } catch (error) {
      console.debug('Error accessing sessionStorage for message highlight:', error);
    }
  });

  return searchTerm;
}

/**
 * Utility to check if a message should be highlighted
 * @param messageId The message ID to check
 * @returns true if this message should be highlighted
 */
export function shouldHighlightMessage(messageId: string): boolean {
  try {
    const storedSearchId = sessionStorage.getItem('messageSearchId');
    return storedSearchId === messageId;
  } catch {
    return false;
  }
}

/**
 * Clear all search highlighting state
 */
export function clearSearchHighlight(): void {
  try {
    sessionStorage.removeItem('messageSearchId');
    sessionStorage.removeItem('messageSearchTerm');
  } catch (error) {
    console.debug('Error clearing search highlight:', error);
  }
}
