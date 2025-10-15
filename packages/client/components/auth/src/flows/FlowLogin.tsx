import { Match, Switch, Show } from "solid-js";

import { Trans } from "@lingui-solid/solid/macro";
import { styled } from "styled-system/jsx";

import { useClientLifecycle } from "@revolt/client";
import { State, TransitionType } from "@revolt/client/Controller";
import { useModals } from "@revolt/modal";
import { Navigate } from "@revolt/routing";
import { Button, CircularProgress, Column, Row, iconSize } from "@revolt/ui";

import MdArrowBack from "@material-design-icons/svg/filled/arrow_back.svg?component-solid";

import Wordmark from "../../../../public/assets/web/wordmark.svg?component-solid";

import { FlowTitle } from "./Flow";
import { Fields, Form } from "./Form";

const Logo = styled(Wordmark, {
  base: {
    height: "0.8em",
    display: "inline",
    fill: "var(--md-sys-color-on-surface)",
  },
});

/**
 * Flow for logging into an account
 */
export default function FlowLogin() {
  const modals = useModals();
  const { lifecycle, isLoggedIn, login, selectUsername } = useClientLifecycle();

  // Feature flag to control whether the "Resend verification" link is shown.
  // Set to `true` to re-enable the link.
  const ALLOW_RESEND_VERIFICATION = false;

  /**
   * Log into account
   * @param data Form Data
   */
  async function performLogin(data: FormData | Record<string, any>) {
    const email = (data instanceof FormData ? (data.get("email") as string) : data.email) as string;
    const password = (data instanceof FormData ? (data.get("password") as string) : data.password) as string;

    const emailLower = (email ?? "").toLowerCase().trim();
    if (
      !(
        emailLower.endsWith("@zetaglobal.com") ||
        emailLower.endsWith("@zetaglobal")
      )
    ) {
      throw new Error("Only zetaglobal accounts are allowed to log in.");
    }

    await login(
      {
        email,
        password,
      },
      modals,
    );
  }

  /**
   * Select a new username
   * @param data Form Data
   */
  async function select(data: FormData | Record<string, any>) {
    const username = (data instanceof FormData ? (data.get("username") as string) : data.username) as string;
    await selectUsername(username);
  }

  return (
    <>
      <Switch
        fallback={
          <>
            <FlowTitle subtitle={<Trans>Sign into Stoat</Trans>} emoji="wave">
              <Trans>Welcome!</Trans>
            </FlowTitle>
            <Form onSubmit={performLogin} json>
              <Fields fields={["email", "password"]} />
              <Column gap="xl" align>
                <a href="/login/reset">
                  <Button variant="text">
                    <Trans>Reset password</Trans>
                  </Button>
                </a>
                <Show when={ALLOW_RESEND_VERIFICATION}>
                  <a href="/login/resend">
                    <Button variant="text">
                      <Trans>Resend verification</Trans>
                    </Button>
                  </a>
                </Show>
              </Column>
              <Row align justify>
                <a href="/login">
                  <Button variant="text">
                    <MdArrowBack {...iconSize("1.2em")} /> <Trans>Back</Trans>
                  </Button>
                </a>
                <Button type="submit">
                  <Trans>Login</Trans>
                </Button>
              </Row>
            </Form>
          </>
        }
      >
        <Match when={isLoggedIn()}>
          <Navigate href="/app" />
        </Match>
        <Match when={lifecycle.state() === State.LoggingIn}>
          <CircularProgress />
        </Match>
        <Match when={lifecycle.state() === State.Onboarding}>
          <FlowTitle
            subtitle={
              <Trans>
                Pick a username that you want people to be able to find you by.
                This can be changed later in your user settings.
              </Trans>
            }
          >
            <Row gap="sm">
              <Trans>Welcome to</Trans> <Logo />
            </Row>
          </FlowTitle>

          <Form onSubmit={select} json>
            <Fields fields={["username"]} />
            <Row align justify>
              <Button
                variant="text"
                onPress={() =>
                  lifecycle.transition({
                    type: TransitionType.Cancel,
                  })
                }
              >
                <MdArrowBack {...iconSize("1.2em")} /> <Trans>Cancel</Trans>
              </Button>
              <Button type="submit">
                <Trans>Confirm</Trans>
              </Button>
            </Row>
          </Form>
        </Match>
      </Switch>
    </>
  );
}
