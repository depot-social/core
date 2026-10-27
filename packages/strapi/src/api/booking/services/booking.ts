/**
 * booking service
 */

import { factories } from '@strapi/strapi';
import { createBookingStatusService } from '../utils/booking-status';

export default factories.createCoreService(
  'api::booking.booking',
  ({ strapi }) => ({
    ...createBookingStatusService(strapi),
  })
);
