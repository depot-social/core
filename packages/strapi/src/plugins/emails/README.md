## Emails plugin

Global email service for sending depot emails. If enabled, the service is invoked from lifecycle hooks.

For delivery, this plugin uses the official Strapi Email plugin. See the provider configuration here: `https://docs.strapi.io/dev-docs/plugins/email`.

### Build

```bash
pnpm build
```

### Email templates (database-driven)

All email template content is stored in the singleType `plugin::emails.email-template`. For markup and styling [MJML](https://mjml.io/) can be used.

### Provided emails

| Key | Description |
| --- | --- |
| `bookingRequest` | Notify resource owner about a new booking request |
| `bookingConfirmed` | Notify customer after the resource owner confirms a booking |
| `bookingCancelled` | Notify customer and resource owner after either party cancels |
| `resourceAwaitsActivation` | Notify depot administrator about a new resource requiring review/approval |
| `organizationAwaitsActivation` | Notify depot administrator about a new organization requesting non-profit recognition |
| `berlinBooking` | Notify Berlin room provider about a new booking request (and copy to requester) |
| `emailConfirmation` | Registration: confirm email address (sent by users-permissions, see below) |
| `resetPassword` | Forgot password: reset link (sent by users-permissions, see below) |

### Registration and reset password emails (users-permissions)

These two emails are sent by Strapi's core users-permissions plugin, which reads them from its own store (Settings → Users & Permissions plugin → Email templates). To style them like all other emails, maintain them in the email-template singleType instead (`emailConfirmationTitle`/`Body`, `resetPasswordTitle`/`Body`).

The plugin renders title and body into `layout` via MJML and writes the resulting HTML into the users-permissions store:
- on Strapi startup (bootstrap)
- whenever the email-template singleType is saved

If title or body is empty, Strapi's own template is kept. Manual edits in the users-permissions settings are overwritten by the next sync. MJML errors are logged and the current template is kept.

Placeholders are converted to users-permissions syntax (`{{ URL }}` → `<%= URL %>`) and filled by Strapi when sending:

| Email | Body | Title |
| --- | --- | --- |
| `emailConfirmation` | `{{ URL }}`, `{{ CODE }}`, `{{ SERVER_URL }}`, `{{ ADMIN_URL }}`, `{{ USER.username }}`, `{{ USER.email }}` | `{{ USER.username }}`, `{{ USER.email }}` |
| `resetPassword` | `{{ URL }}`, `{{ TOKEN }}`, `{{ SERVER_URL }}`, `{{ ADMIN_URL }}`, `{{ USER.username }}`, `{{ USER.email }}` | `{{ USER.username }}`, `{{ USER.email }}` |

Links must be built like this:

```mjml
<mj-button href="{{ URL }}?confirmation={{ CODE }}">E-Mail bestätigen</mj-button>
<mj-button href="{{ URL }}?code={{ TOKEN }}">Passwort zurücksetzen</mj-button>
```

For reset password, `URL` is the "Reset password page" configured in the users-permissions advanced settings.

Booking status templates use `bookingConfirmedTitle`/`bookingConfirmedBody` and
`bookingCancelledTitle`/`bookingCancelledBody`. Empty fields use German defaults;
the existing `layout` is reused (or a minimal MJML layout when absent).
Placeholders: `customerName`, `resourceOwnerName`, `resourceTitle`, `start`, `ende`,
`bookedUnits`, `bookingUrl`, `priceText`, `actorName`, `actorRole`.
`actorName` and `actorRole` describe who cancelled. Prices come from the saved
booking and are omitted from default content when pricing is disabled.

Status emails run only after a real public-API status change has been persisted.
Each recipient gets one independent send attempt. Failures are logged with
booking ID, mail type and recipient role; the status remains saved. There is no
queue or automatic retry. Admin corrections do not send status emails.

### Mustache-style templating

Templates use a Mustache-like syntax compiled via lodash.template with minimal escaping:
- Interpolation (unescaped): `{{ variable }}`
- Conditionals: `{{ #if condition }}` ... `{{ #elseif other }}` ... `{{ #else }}` ... `{{ /if }}`

Example body snippet:

```mjml
<mj-text>
  You received a booking request from "{{ customerName }}".
  {{ #if commentCustomer }}
  Comment by the customer: "{{ commentCustomer }}".
  {{ /if }}
</mj-text>
<mj-button href="{{ bookingUrl }}" background-color="#d8340a" color="#ffffff">
  Confirm booking request
</mj-button>
```

Example layout:

```mjml
<mjml>
  <mj-head>
    <mj-font name="Poppins" href="https://fonts.googleapis.com/css?family=Poppins" />
  </mj-head>
  <mj-body background-color="#fff2e1">
    <mj-section>
      <mj-column>
        <mj-image width="170px" src="..."></mj-image>
      </mj-column>
    </mj-section>

    <mj-section background-color="white" border-radius="8px">
      <mj-column>
        <mj-text font-size="18px" color="#d8340a" font-weight="700" font-family="Poppins, Arial">{{headline}}</mj-text>
        {{content}}
      </mj-column>
    </mj-section>
  </mj-body>
  
</mjml>
```

### Templates

Copy each template into the corresponding field of `plugin::emails.email-template` inside your Strapi backend ([Content Types > Email templates](/admin/content-manager/single-types/plugin::emails.email-template?plugins[i18n][locale]=en)).

Body templates contain MJML fragments for the shared `layout`.
For an up-to-date list of all avaiable `{{placeholders}}` refer to `emails-service.ts`.

#### `layout`

```mjml
<mjml>
      <mj-head>
        <mj-font name="Poppins" href="https://fonts.googleapis.com/css?family=IBM+Plex+Sans+Condensed:wght@400;700" />
        <mj-font name="IBM Plex Sans Condensed" href="https://fonts.googleapis.com/css?family=IBM+Plex+Sans+Condensed:wght@400;700" />
      </mj-head>
      <mj-body background-color="#EBEBEB">
        <mj-section>
          <mj-column>
            <mj-image width="300px" border-radius="5px" src="data:image/png;base...."></mj-image>
          </mj-column>
        </mj-section>

        <mj-section background-color="white" border-radius="8px">
          <mj-column>
            <mj-text font-size="18px" font-weight="700" font-family="IBM Plex Sans Condensed, sans-serif">{{headline}}</mj-text>
            {{content}}
          </mj-column>
        </mj-section>
        <mj-section>
          <mj-column>
            <mj-text font-family="IBM Plex Sans Condensed, sans-serif" align="center" font-weight="bold" color="#575757" font-size="18px">
              FOOTER
            </mj-text>
          </mj-column>
        </mj-section>
      </mj-body>
    </mjml>
```

#### `bookingRequestTitle`

```text
Neue Buchungsanfrage für {{resourceTitle}}
```

#### `bookingRequestBody`

```mjml
<mj-text font-family="Poppins, Arial">
Du hast eine Buchungsanfrage von "{{customerName}}" über das depot erhalten! Hier findest Du die Details:
Angefragte Ressource: {{bookedUnits}}x {{resourceTitle}} im Zeitraum {{start}} - {{ende}} (@todo Tage/Stunden)
Preis: {{priceText}}
{{ if commentCustomer }}
Die Ausleiher:in hat folgende Nachricht hinterlassen: "{{commentCustomer}}".
{{ /if }}
Die vollständige Buchung kannst Du <a href="{{bookingUrl}}">in Deinem depot</a> einsehen.
<strong>Du bist mit der Buchung einverstanden?</strong>
</mj-text>
<mj-button font-family="Poppins, Arial" href="{{bookingUrl}}" background-color="#d8340a" color="#ffffff">
  Anfrage bestätigen
</mj-button>
<mj-text font-family="Poppins, Arial">
Du möchtest Änderungen am Buchungszeitraum vornehmen, die Stückzahl verändern oder die Buchung stornieren?
</mj-text>
<mj-button font-family="Poppins, Arial" href="{{bookingUrl}}" background-color="#d9d9d9" color="#000000">
  Buchung bearbeiten
</mj-button>
```

#### `bookingConfirmedTitle`

```text
Buchung bestätigt
```

#### `bookingConfirmedBody`

```mjml
<mj-text>
  Hallo {{ customerName }},
</mj-text>

<mj-text>
  gute Nachrichten: {{ resourceOwnerName }} hat deine Buchung für
  <strong>{{ resourceTitle }}</strong> bestätigt.
</mj-text>

<mj-text>
  <strong>Deine Buchungsdetails</strong><br />
  Beginn: {{ start }}<br />
  Ende: {{ ende }}<br />
  Anzahl: {{ bookedUnits }}<br />
  Verleiher:in: {{ resourceOwnerName }}
</mj-text>

{{ #if priceText }}
<mj-text>
  {{ priceText }}
</mj-text>
{{ /if }}

<mj-text>
  Alle Details findest du in deiner Buchungsübersicht.
  Wenn du Änderungen benötigst, storniere bitte die bestehende
  Buchung und sende eine neue Anfrage.
</mj-text>

<mj-button href="{{ bookingUrl }}">
  Buchung ansehen
</mj-button>

<mj-text>
  Viele Grüße<br />
  dein depot-Team
</mj-text>
```

#### `bookingCancelledTitle`

```text
Buchung storniert
```

#### `bookingCancelledBody`

```mjml
<mj-text>
  Hallo,
</mj-text>

<mj-text>
  die Buchung für <strong>{{ resourceTitle }}</strong> wurde von
  {{ actorName }} ({{ actorRole }}) storniert.
</mj-text>

<mj-text>
  <strong>Details der stornierten Buchung</strong><br />
  Ausleiher:in: {{ customerName }}<br />
  Verleiher:in: {{ resourceOwnerName }}<br />
  Beginn: {{ start }}<br />
  Ende: {{ ende }}<br />
  Anzahl: {{ bookedUnits }}
</mj-text>

<mj-text>
  Diese Nachricht geht an beide Beteiligten.
  Die stornierte Buchung kann nicht wieder aktiviert werden.
  Falls ihr eine neue Buchung vereinbaren möchtet, ist eine
  neue Buchungsanfrage erforderlich.
</mj-text>

<mj-button href="{{ bookingUrl }}">
  Stornierte Buchung ansehen
</mj-button>

<mj-text>
  Viele Grüße<br />
  dein depot-Team
</mj-text>
```

#### `resourceAwaitsActivationTitle`

```text
Neue Ressource freischalten: {{resourceTitle}}
```

#### `resourceAwaitsActivationBody`

```mjml
<mj-text font-family="Poppins, Arial">
Die depot Nutzer:in "{{username}}" hat die Ressource "{{resourceTitle}}" eingestellt.
Diese ist unter <a href="{{fullResourceUrl}}">"{{fullResourceUrl}}"</a> zu finden.
Um die Ressource freizuschalten, gehen Sie bitte auf 'Ressource bearbeiten' und setzen Sie ein Häckchen bei 'Genehmigt'.
Die Nutzer:in wird daraufhin automatisch über die Freischaltung verständigt.
</mj-text>
```

#### `organizationAwaitsActivationTitle`

```text
Antrag auf Gemeinnützigkeit von {{username}}
```

#### `organizationAwaitsActivationBody`

```mjml
<mj-text font-family="Poppins, Arial">
Liebe:r Administrator:in,
Die depot Nutzer:in "{{username}}" hat für die Organisation "{{organizationName}}" um Anerkennung auf Gemeinnützigkeit gebeten.
Das Profil der Nutzer:in ist unter "{{profileUrl}}" zu finden.
Als Bewilligungsgrund wurde folgender genannt: "{{reason}}".
Es wurde zudem ein Anhang unter "{{attachmentUrl}}" hinterlegt und mit dem Nutzerprofil verknüpft.
Um dem Antrag zu zustimmen, gehen Sie bitte in Ihrem Browser auf "{{profileUrl}}".
</mj-text>
```
