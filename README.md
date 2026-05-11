# RestoManager

RestoManager is a restaurant SaaS for stock, invoices, recipes, HACCP, planning, time clock, and analytics.

This repository is the **sales and demo copy** of the product.

## What it includes

- a commercial landing page
- a self-service restaurant configurator
- pricing and packaging
- a sales demo script
- a delivery and due diligence pack

## How to use

1. Open `index.html` directly in a browser, or
2. run the static demo with Docker:

```bash
docker compose up
```

Then open `http://localhost:8080`.

## Restaurant self-service

Each restaurant can configure:

- restaurant identity
- plan and billing
- enabled modules
- HACCP settings
- stock rules
- OCR settings
- integrations
- label printing

The configuration is stored in the browser and can be exported as JSON.

## Sales docs

- [Offer and pricing](sales/offer.md)
- [Demo script](sales/demo-script.md)
- [Due diligence checklist](sales/due-diligence.md)
- [Delivery checklist](sales/delivery-checklist.md)
