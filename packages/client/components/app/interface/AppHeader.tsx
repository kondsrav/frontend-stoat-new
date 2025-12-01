import { GlobalSearch } from "./GlobalSearch";
import { Row, iconSize } from "@revolt/ui";
import { styled } from "styled-system/jsx";

import MdMenu from "@material-design-icons/svg/outlined/menu.svg?component-solid";

/**
 * Header bar styling
 */
const HeaderBar = styled("div", {
  base: {
    height: "48px",
    background: "var(--md-sys-color-surface-container)",
    borderBottom: "1px solid var(--md-sys-color-outline-variant)",
    display: "flex",
    alignItems: "center",
    padding: "0 16px",
    gap: "16px",
    flexShrink: 0,
  },
});

/**
 * Application header with global search
 */
export function AppHeader() {
  return (
    <HeaderBar>
      <div style={{ 
        cursor: "pointer", 
        display: "flex", 
        "align-items": "center",
        padding: "8px" 
      }}>
        <MdMenu {...iconSize(20)} />
      </div>
      <div style={{ "flex-grow": 1, display: "flex", "justify-content": "center" }}>
        <GlobalSearch />
      </div>
      <div style={{ width: "20px" }} /> {/* Spacer for symmetry */}
    </HeaderBar>
  );
}
