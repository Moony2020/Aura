import { logoutAction } from "@/server/auth/actions";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button className="auth-form__secondary" type="submit">
        Sign out
      </button>
    </form>
  );
}
