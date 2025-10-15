import { Trans } from "@lingui-solid/solid/macro";

import { useApi } from "@revolt/client";
import { useNavigate, useParams } from "@revolt/routing";
import { Button } from "@revolt/ui";

import { FlowTitle } from "./Flow";
import { Fields, Form } from "./Form";

/**
 * Flow for confirming a new password
 */
export default function FlowConfirmReset() {
  const api = useApi();
  const { token } = useParams();
  const navigate = useNavigate();

  /**
   * Confirm new password
   * @param data Form Data
   */
  async function reset(data: FormData | Record<string, any>) {
    const password = (data instanceof FormData ? (data.get("new-password") as string) : data["new-password"]) as string;
    const remove_sessions = !!(data instanceof FormData ? (data.get("log-out") as "on" | undefined) : data["log-out"]);

    await api.patch("/auth/account/reset_password", {
      password,
      token,
      remove_sessions,
    });

    navigate("/login/auth", { replace: true });
  }

  return (
    <>
      <FlowTitle>
        <Trans>Reset password</Trans>
      </FlowTitle>
  <Form onSubmit={reset} json>
        <Fields fields={["new-password", "log-out"]} />
        <Button type="submit">
          <Trans>Reset</Trans>
        </Button>
      </Form>
      <a href="/login/auth">
        <Button variant="text">
          <Trans>Go back to login</Trans>
        </Button>
      </a>
    </>
  );
}
