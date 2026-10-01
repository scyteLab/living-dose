/**
 * Shop settings. Prices, fees and delivery areas here are placeholders:
 * the Living Dose team sets the real ones before launch.
 */
export const shop = {
  currency: 'NGN',
  deliveryFee: 1500, // naira
  freeDeliveryFrom: 25000, // orders at or above this total get free delivery
  deliveryStates: ['Lagos'], // where delivery is available at launch
  maxQuantity: 20,
  // Delivery windows offered from tomorrow onwards
  slots: ['morning', 'afternoon', 'evening'],
  daysAhead: 5,
}
