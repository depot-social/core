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
