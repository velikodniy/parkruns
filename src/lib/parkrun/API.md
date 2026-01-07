# Parkrun API Documentation

> [!WARNING]
> This documents an unofficial, reverse-engineered API from the parkrun mobile app. This project is **NOT** affiliated with, endorsed by, or connected to parkrun Limited. Use at your own risk; the API may change without notice.

**Last Updated:** 2026-01-07

## Authentication

Tokens are obtained via a `POST` request and expire after 7200 seconds (2 hours).

**Endpoint:** `https://api.parkrun.com/user_auth.php`

**Request:**

- **Headers:**
  - `Authorization: Basic {base64(CLIENT_ID:CLIENT_SECRET)}`
  - `Content-Type: application/x-www-form-urlencoded`
- **Body:** `username={ATHLETE_ID}&password={PASSWORD}&scope=app&grant_type=password`

**Response:**

```json
{
  "access_token": "...",
  "token_type": "bearer",
  "expires_in": 7200,
  "scope": "app"
}
```

> [!IMPORTANT]
> Include `access_token` as a query parameter in all subsequent requests: `?access_token={token}&scope=app`

## Endpoints

| Resource | Path | Description |
| :--- | :--- | :--- |
| **Athlete Results** | `GET /v1/results` | All run results for an athlete |
| **Athlete Profile** | `GET /v1/athletes/{id}` | Basic profile info (includes PII) |
| **Athlete Runs** | `GET /v1/athletes/{id}/runs` | Lightweight run summary with stats |
| **Athlete Clubs** | `GET /v1/athletes/{id}/clubs` | Clubs associated with the athlete |
| **Events List** | `GET /v1/events` | Directory of all parkrun venues |
| **Event Details** | `GET /v1/events/{num}` | Detailed info for a specific venue |
| **Event Results** | `GET /v1/events/{num}/results` | All finishers for a specific event/edition |
| **Countries** | `GET /v1/countries` | List of active parkrun countries |

### Resource Details

#### Athlete Results

`GET /v1/results?athleteId={id}&expandedDetails=true&limit=100`

Key fields returned in `RunResult`:

- `abstractId`: **Event edition number** (Use this for URLs!)
- `EventNumber`: Unique venue ID
- `RunTime`: Finish time as string (`"00:22:24"`)
- `AgeGrading`: Decimal value (`"0.6138"` = 61.38%)
- `WasPbRun`: Course-specific PB at the time (`"0"`/`"1"`)
- `GenuinePB`: All-time PB for this athlete (`"0"`/`"1"`)

#### Athlete Profile

`GET /v1/athletes/{id}?expandedDetails=true`

Returns `AthleteID`, `FirstName`, `LastName`, `Sex`, and sensitive fields like `DOB`, `eMailID`, and `Postcode`.

#### Events & Results

- **Events List:** `GET /v1/events` returns venue IDs (`EventNumber`) and slugs (`EventName`).
- **Event Details:** `GET /v1/events/{num}` includes `TotalEventsStaged` and contact emails.
- **Event Results:** `GET /v1/events/{num}/results?abstractId={edition}` returns all finishers for that edition.

## Field Reference & URLs

| API Field | Map to | Description |
| :--- | :--- | :--- |
| `EventNumber` | `eventId` | Unique venue identifier (lookup in `events.json`) |
| `abstractId` | `eventEdition` | Edition number (used for result URLs) |
| `RunId` | - | **Internal ID - DO NOT USE** |

### URL Construction Patterns

- **Venue:** `https://{CountrySiteUrl}/{EventName}/`
- **Results:** `https://{CountrySiteUrl}/{EventName}/results/{abstractId}/`
- **Athlete:** `https://{CountrySiteUrl}/parkrunner/{AthleteID}/`

## Common Gotchas

- **RunId vs abstractId:** Never use `RunId` for result URLs. Always use `abstractId`.
- **String Types:** The API returns all numeric values (positions, counts, grading) as strings.
- **First Timer:** `FirstTimer=1` means first visit to that venue, not first parkrun ever.
- **Series ID:** `1` = Saturday 5k, `2` = Sunday 2k junior.
- **Rate Limiting:** The API is sensitive; use `limit` and `offset` responsibly.

## Implementation Notes

### Data Privacy

> [!CAUTION]
> The `/v1/athletes/{id}` endpoint returns sensitive PII. **Never expose** `DOB`, `eMailID`, `Postcode`, `MobileNumber`, or `ConfirmCode` in public-facing data or build artifacts.

### Unused Endpoints

- `/v1/athletes/{id}/volunteers`: List of volunteer roles.
- `/v1/athletes/{id}/statistics`: Global parkrun stats (not athlete-specific).
- `/v1/sync`: 404 Error (Deprecated).
