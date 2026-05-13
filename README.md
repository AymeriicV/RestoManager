# Operyx

Operyx is a premium restaurant operating system for stock, invoices, recipes, HACCP, planning, badgeuse, production, and analytics.

This repository is the **sales, demo, and tenant provisioning copy** of the product.

The final step generates a deployment bundle for the real application repository:
`https://github.com/AymeriicV/chez-therese-denise`

The local demo can also expose a provisioning API that:

- receives the tenant configuration
- creates a per-restaurant job
- clones the application repository
- generates a tenant compose file and `.env`
- prepares the delivery email and instance access data

## Domain setup

If you deploy on `aymeric.online` with Cloudflare, use the Cloudflare setup guide in `sales/cloudflare-setup.md`.

For full wildcard automation, the optional custom edge proxy lives in `infra/caddy-cloudflare/`.

## What it includes

- a premium landing page
- a self-service restaurant onboarding wizard
- an activation pack export
- a provisioning progress workflow
- sales and delivery documentation
- a generic Android Capacitor shell for Operyx instances

## Android shell

The Android app lives in [mobile/android](/home/RestoManager/mobile/android) and is designed to work with any Operyx instance, not only a single tenant.

It provides:

- a premium dark shell
- instance URL onboarding
- embedded site launch
- Bluetooth printer architecture
- Android Studio compatible project files

## How to use

1. Open `index.html` directly in a browser, or
2. run the static demo with Docker:

```bash
docker compose up
```

Then open `http://localhost:3001`.

## Restaurant self-service

Each restaurant can configure:

- identity and contact details
- opening days and services
- team size and owner account
- stock zones and product families
- HACCP equipment and cleaning plan
- temperature checkpoints
- label and ticket printers
- enabled modules

The configuration is stored in the browser and can be exported as JSON, including:

- the tenant activation pack
- the `operyx.provisioning.json` payload consumed by the tenant instance
- a Docker Compose file for the client instance
- an `.env` file for the client instance
- a provisioning shell script for the real application repository

## Sales docs

- [Platform overview](sales/offer.md)
- [Demo script](sales/demo-script.md)
- [Due diligence checklist](sales/due-diligence.md)
- [Delivery checklist](sales/delivery-checklist.md)
