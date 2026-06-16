import type { Core } from '@strapi/strapi';
import { isValid, isBefore } from 'date-fns';
import { StrapiContext, Token } from '@depot/shared';
import { PricesService } from '../services/prices-service';

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  async getPrice(ctx: StrapiContext) {
    const { params } = ctx;
    const { id } = params;
    let { start, end, units } = ctx.query;
    units = Number(units);

    if (!start || !end || isNaN(units)) {
      ctx.throw(400, 'Missing parameters');
    }

    start = new Date(start);
    end = new Date(end);

    if (!isValid(start) || !isValid(end)) {
      ctx.throw(400, 'Parameter start or end is not a valid date');
    }

    if (isBefore(end, start)) {
      ctx.throw(400, 'Parameter end should not be before start');
    }

    // User MAY be authenticated, in this case we can use the user's nonProfit status
    // to determine the price
    // @todo Move into public core service
    const jwtService = await strapi.plugin('users-permissions').service('jwt');

    // As config.auth is set to false for this route, ctx.state.user seems to be null by default

    const userToken: Token | null = await jwtService.getToken(ctx);
    const loggedInUserId = userToken ? userToken.id : null;

    const pricesService: PricesService = await strapi
      .plugin('prices')
      .service('pricesService');

    const price = await pricesService.getPrice(
      id,
      start,
      end,
      units,
      loggedInUserId
    );

    ctx.body = price;
  },
});
