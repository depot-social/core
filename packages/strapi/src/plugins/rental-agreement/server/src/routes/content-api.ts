export default [
  {
    method: 'GET',
    path: '/bookings/:id/rental-agreement',
    handler: 'rentalAgreementController.getRentalAgreement',
    config: {
      prefix: '',
      policies: ['global::isBookingPartyPolicy'],
    },
  },
];
