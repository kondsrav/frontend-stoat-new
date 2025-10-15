import { Trans } from "@lingui-solid/solid/macro";

import { CONFIGURATION } from "@revolt/common";
import { useNavigate } from "@revolt/routing";
import { Button, Row, iconSize } from "@revolt/ui";

import MdArrowBack from "@material-design-icons/svg/filled/arrow_back.svg?component-solid";

import { useApi } from "../../../client";

import { FlowTitle } from "./Flow";
import { setFlowCheckEmail } from "./FlowCheck";
import { Fields, Form } from "./Form";

/**
 * Flow for creating a new account
 */
export default function FlowCreate() {
  const api = useApi();
  const navigate = useNavigate();

  /**
   * Create an account
   * @param data Form Data
   */
  async function create(data: FormData | Record<string, any>) {
    // Accept either FormData (legacy) or a plain object when json=true
    const email = (data instanceof FormData ? (data.get("email") as string) : data.email) as string;
    const password = (data instanceof FormData ? (data.get("password") as string) : data.password) as string;
    const captcha = (data instanceof FormData ? (data.get("captcha") as string) : data.captcha) as string;

    // Enforce only zetaglobal accounts are allowed to register on the frontend.
    const emailLower = (email ?? "").toLowerCase().trim();
    if (
      !(
        emailLower.endsWith("@zetaglobal.com") ||
        emailLower.endsWith("@zetaglobal")
      )
    ) {
      // Throwing will cause the Form wrapper to display the error message
      throw new Error("Only zetaglobal accounts are allowed to register.");
    }

    const payload = { email, password, captcha };

    // Use the shared API client which sends JSON by default
    await api.post("/auth/account/create", payload);

    // After creating an account, many deployments require email verification.
    // For local development (or when SMTP is disabled) we want a simple flow:
    // redirect the user to the login page so they can sign in immediately.
    // If you prefer auto-login, replace the navigate call with an API login.
    try {
      // Redirect to login page after successful registration
      navigate("/login/auth", { replace: true });
    } catch (err) {
      // fallback to check screen if navigation fails for some reason
      setFlowCheckEmail(email);
      navigate("/login/check", { replace: true });
    }
  }

  return (
    <>
      <FlowTitle subtitle={<Trans>Create an account</Trans>} emoji="wave">
        <Trans>Hello!</Trans>
      </FlowTitle>
  <Form onSubmit={create} captcha={CONFIGURATION.HCAPTCHA_SITEKEY} json>
        <Fields fields={["email", "password"]} />
        <Row justify>
          <a href="/login">
            <Button variant="text">
              <MdArrowBack {...iconSize("1.2em")} /> <Trans>Back</Trans>
            </Button>
          </a>
          <Button type="submit">
            <Trans>Register</Trans>
          </Button>
        </Row>
      </Form>
      {import.meta.env.DEV && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            background: "white",
            color: "black",
            cursor: "pointer",
          }}
          onClick={() => {
            setFlowCheckEmail("insert@stoat.chat");
            navigate("/login/check", { replace: true });
          }}
        >
          Mock Submission
        </div>
      )}
    </>
  );
}
