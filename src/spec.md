# Specification

## Summary
**Goal:** Add QR code generation functionality that creates a scannable UPI payment QR code from the configured UPI ID.

**Planned changes:**
- Generate a QR code from the UPI ID using the UPI payment string format
- Display the generated QR code in the application interface
- Use the existing UPI_ID constant from frontend/src/config/constants.ts
- Include the 10% platform fee in the payment amount calculation

**User-visible outcome:** Users will see a scannable QR code that initiates UPI payments with the correct payment details including platform fees.
