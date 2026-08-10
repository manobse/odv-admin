// Shared Charge Type constants — mirrors CHARGE_TYPES in odv-admin-api/models/SportModels.js
export const CHARGE_TYPES = [
  { value: 'BOOKING', label: 'Booking' },
  { value: 'PRODUCT', label: 'Product' },
  { value: 'RENTAL',  label: 'Rental'  },
  { value: 'SERVICE', label: 'Service' },
]
export const CHARGE_TYPE_LABEL = Object.fromEntries(CHARGE_TYPES.map(t => [t.value, t.label]))
export const CHARGE_TYPE_COLOR = { BOOKING: 'blue', PRODUCT: 'teal', RENTAL: 'amber', SERVICE: 'accent' }

// Non-BOOKING charge types sellable through the Sales module (mirrors SELLABLE_TYPES
// in odv-admin-api/routes/sales.js). BOOKING charges are only ever sold via Bookings.
export const SELLABLE_CHARGE_TYPES = ['PRODUCT', 'RENTAL', 'SERVICE']
