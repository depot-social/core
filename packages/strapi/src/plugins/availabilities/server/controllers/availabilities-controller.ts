import type { Core } from '@strapi/strapi';
import { isValid, isBefore, isAfter } from 'date-fns';
import { AvailabilitiesService } from '../services/availabilities-service';
import {
  AvailabilitiesGetMaxAvailableResponse,
} from '@depot/shared';
import { ParameterizedContext } from 'koa';

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  async getDashboard(ctx: ParameterizedContext) {
    const { state } = ctx;
    const { user } = state;

    if (!user) {
      ctx.throw(401, 'User must be authenticated');
    }

    const availabilitiesService: AvailabilitiesService = await strapi
      .plugin('plugin-availabilities')
      .service('availabilitiesService');

    const dashboard = await availabilitiesService.getDashboardByUserId(user.id);

    ctx.body = dashboard;
  },

  async getCalendar(ctx: ParameterizedContext) {
    const { request } = ctx;
    const { query } = request;
    const { start, end, resource_id } = query as { start: string, end: string, resource_id: number };

    if (!start || !end || !resource_id) {
      ctx.throw(400, 'Missing parameters');
    }

    const startDate = new Date(start);
    let endDate = new Date(end);

    // Validate dates
    if (!isValid(startDate) || !isValid(endDate)) {
      ctx.throw(400, 'Parameter start or end is not a valid date');
    }

    if (isBefore(endDate, startDate)) {
      ctx.throw(400, 'Parameter end should not be before start');
    }

    // end should not be more than 6 months from start
    const maxEnd = new Date(startDate.getTime() + 6 * 30 * 24 * 60 * 60 * 1000);

    if (isAfter(endDate, maxEnd)) {
      // ctx.throw(400, 'Parameter end should not be more than 6 months from start');
      endDate = maxEnd;
    }

    const availabilitiesService: AvailabilitiesService = await strapi
      .plugin('plugin-availabilities')
      .service('availabilitiesService');

    const calendar = await availabilitiesService.getCalendar(
      ctx,
      startDate,
      endDate,
      resource_id,
    );

    ctx.body = {
      data: calendar,
    };
  },

  async getMaxAvailable(ctx: ParameterizedContext) {
    const { request } = ctx;
    const { query } = request;
    let { start, end, resource_id, exclude_booking_id } = query as { start: string, end: string, resource_id: number, exclude_booking_id: number | undefined };

    if (!start || !end || !resource_id) {
      ctx.throw(400, 'Missing parameters');
    }

    if (exclude_booking_id) {
      exclude_booking_id = Number(exclude_booking_id);

      if (isNaN(exclude_booking_id)) {
        ctx.throw(400, 'Parameter exclude_booking_id is not a number');
      }
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    // Validate dates
    if (!isValid(startDate) || !isValid(endDate)) {
      ctx.throw(400, 'Parameter start or end is not a valid date');
    }

    if (isBefore(endDate, startDate)) {
      ctx.throw(400, 'Parameter end should not be before start');
    }

    // @todo End should not be too far away from start to save server resources

    if (endDate < startDate) {
      ctx.throw(400, 'Parameter end should not be before start');
    }

    const availabilitiesService: AvailabilitiesService = await strapi
      .plugin('plugin-availabilities')
      .service('availabilitiesService');

    const maxAvailable = await availabilitiesService.getMaxAvailable(
      ctx,
      startDate,
      endDate,
      resource_id,
      exclude_booking_id,
    );

    ctx.body = {
      data: maxAvailable,
    } as AvailabilitiesGetMaxAvailableResponse;
  },
});
