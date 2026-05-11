# Operyx

Operyx is a premium restaurant operating system for stock, invoices, recipes, HACCP, planning, badgeuse, production, and analytics.

This repository is the **sales and demo copy** of the product.

## What it includes

- a premium landing page
- a self-service restaurant onboarding wizard
- an activation pack export
- sales and delivery documentation

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

The configuration is stored in the browser and can be exported as JSON, including the activation pack that can be handed to a client tenant.

## Sales docs

- [Platform overview](sales/offer.md)
- [Demo script](sales/demo-script.md)
- [Due diligence checklist](sales/due-diligence.md)
- [Delivery checklist](sales/delivery-checklist.md)
