import { Trans } from "@lingui-solid/solid/macro";

import { useApi } from "@revolt/client";
import { CONFIGURATION } from "@revolt/common";
import { useNavigate } from "@revolt/routing";
import { Button } from "@revolt/ui";

import { FlowTitle } from "./Flow";
import { setFlowCheckEmail } from "./FlowCheck";
import { Fields, Form } from "./Form";

/**
 * Flow for resending email verification
 */
export default function FlowResend() {
  const api = useApi();
  const navigate = useNavigate();

  /**
   * Resend email verification
   * @param data Form Data
   */
  async function resend(data: FormData | Record<string, any>) {
    const email = (data instanceof FormData ? (data.get("email") as string) : data.email) as string;
    const captcha = (data instanceof FormData ? (data.get("captcha") as string) : data.captcha) as string;

    await api.post("/auth/account/reverify", {
      email,
      captcha,
    });

    setFlowCheckEmail(email);
    navigate("/login/check", { replace: true });
  }

  return (
    <>
      <FlowTitle>
        <Trans>Resend verification</Trans>
      </FlowTitle>
  <Form onSubmit={resend} captcha={CONFIGURATION.HCAPTCHA_SITEKEY} json>
        <Fields fields={["email"]} />
        <Button type="submit">
          <Trans>Resend</Trans>
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
