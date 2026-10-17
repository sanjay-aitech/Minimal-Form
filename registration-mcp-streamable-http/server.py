import logging
import os
import re
from datetime import date, datetime, timezone
from typing import Any

from dotenv import load_dotenv
from mcp.server.fastmcp import FastMCP
from postgrest.exceptions import APIError
from supabase import Client, create_client

load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("registration-server")

mcp = FastMCP("RegistrationServer", host="127.0.0.1", port=8000)

SUPABASE_URL = os.getenv("SUPABASE_URL", "").strip()
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()

supabase_client: Client | None = None

EMAIL_REGEX = re.compile(r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$")
USERNAME_REGEX = re.compile(r"^[A-Za-z0-9_.-]{2,50}$")
DOB_FORMAT_REGEX = re.compile(r"^\d{4}-\d{2}-\d{2}$")
EARLIEST_DOB = date(1900, 1, 1)


def get_supabase_client() -> Client:
    global supabase_client

    if supabase_client is None:
        if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
            raise RuntimeError(
                "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the .env file."
            )
        supabase_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    return supabase_client


def validate_registration_data(
    username: str, email: str, dob: str
) -> tuple[bool, list[str], dict[str, str]]:
    errors: list[str] = []
    normalized: dict[str, str] = {}

    clean_username = username.strip() if username else ""
    clean_email = email.strip().lower() if email else ""
    clean_dob = dob.strip() if dob else ""

    # Username
    if not clean_username:
        errors.append("Username is required.")
    elif not USERNAME_REGEX.fullmatch(clean_username):
        errors.append(
            "Username must be 2-50 characters and contain only letters, "
            "numbers, dots, hyphens, or underscores."
        )
    else:
        normalized["username"] = clean_username

    # Email
    if not clean_email:
        errors.append("Email address is required.")
    elif (
        len(clean_email) > 254
        or ".." in clean_email
        or not EMAIL_REGEX.fullmatch(clean_email)
    ):
        errors.append("Enter a valid email address.")
    else:
        normalized["email"] = clean_email

    # Date of birth (strict YYYY-MM-DD only)
    if not clean_dob:
        errors.append("Date of birth is required.")
    elif not DOB_FORMAT_REGEX.fullmatch(clean_dob):
        errors.append("Date of birth must be in YYYY-MM-DD format.")
    else:
        try:
            parsed_dob = date.fromisoformat(clean_dob)
        except ValueError:
            errors.append("Date of birth is not a real calendar date.")
        else:
            if parsed_dob < EARLIEST_DOB:
                errors.append("Date of birth cannot be earlier than 1900-01-01.")
            elif parsed_dob > date.today():
                errors.append("Date of birth cannot be in the future.")
            else:
                normalized["dob"] = parsed_dob.isoformat()

    return not errors, errors, normalized


@mcp.tool()
def count_registrations() -> dict[str, Any]:
    """Return the total number of registrations without returning personal details."""
    try:
        response = (
            get_supabase_client()
            .table("registrations")
            .select("id", count="exact")
            .limit(1)
            .execute()
        )
        return {"success": True, "total_registrations": response.count or 0}
    except Exception:
        logger.exception("count_registrations failed")
        return {
            "success": False,
            "message": "Could not count registrations. Check server configuration and database permissions.",
        }


@mcp.tool()
def validate_registration(username: str, email: str, dob: str) -> dict[str, Any]:
    """Validate registration fields without saving anything.

    All three fields are required. If the user has not provided one, ask for it
    instead of guessing. dob must be YYYY-MM-DD; convert natural dates yourself,
    and ask the user if the day/month order is ambiguous (e.g. 03/04/2001).
    """
    valid, errors, normalized = validate_registration_data(username, email, dob)
    if not valid:
        return {"valid": False, "errors": errors}

    return {"valid": True, "normalized": normalized}


@mcp.tool()
def create_registration(
    username: str, email: str, dob: str, confirmed: bool = False
) -> dict[str, Any]:
    """Save a registration to the database.

    Workflow: call validate_registration first, read the normalized details back
    to the user, and only call this with confirmed=True after the user has
    explicitly approved them.
    """
    if not confirmed:
        return {
            "success": False,
            "message": "Not saved. Show the details to the user and ask them to confirm, then call again with confirmed=True.",
        }

    valid, errors, normalized = validate_registration_data(username, email, dob)
    if not valid:
        return {"success": False, "errors": errors}

    try:
        response = (
            get_supabase_client()
            .table("registrations")
            .insert(normalized)
            .execute()
        )
        if not response.data:
            return {"success": False, "message": "The database did not confirm the insert."}

        row = response.data[0]
        return {
            "success": True,
            "registration_id": row.get("id"),
            "created_at": row.get("created_at") or datetime.now(timezone.utc).isoformat(),
        }
    except APIError as exc:
        # 23505 = Postgres unique_violation
        if getattr(exc, "code", None) == "23505" or "duplicate key" in str(exc).lower():
            return {"success": False, "message": "This email is already registered."}
        logger.exception("create_registration failed (database error)")
        return {
            "success": False,
            "message": "Registration could not be saved. Check database permissions and constraints.",
        }
    except Exception:
        logger.exception("create_registration failed")
        return {
            "success": False,
            "message": "Registration could not be saved due to a server error.",
        }


if __name__ == "__main__":
    mcp.run(transport="streamable-http")
