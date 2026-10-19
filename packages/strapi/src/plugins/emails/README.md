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
