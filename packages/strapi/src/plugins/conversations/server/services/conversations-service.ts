import type { Core, Data } from '@strapi/strapi';
import {
  Message,
  Conversation,
  User,
  SocketResponseEmit,
  Booking,
  MessageTypeComponent,
  BookingEventMessageType,
} from '@depot/shared';
import { Socket } from 'socket.io';

export interface ConversationsService {
  authenticateJwtToken: (
    socket: Socket,
    conversationsService: ConversationsService,
    jwtToken: string
  ) => Promise<number | undefined>;
  getUserConversations: (user_id: number) => Promise<Conversation[]>;
  getUserById: (user_id: number) => Promise<User>;
  getUserMessages: (user_id: number) => Promise<Message[]>;
  saveMessage: (message: Partial<Message>) => Promise<Message | undefined>;
  getConversation: (
    conversation_id: number
  ) => Promise<Conversation | undefined>;
  getConversationBetweenUsers: (
    user_id_a: number,
    user_id_b: number
  ) => Promise<Conversation | undefined>;
  addBookingMessage(booking: Booking): Promise<Message | boolean>;
}

export default ({ strapi }: { strapi: Core.Strapi }): ConversationsService => ({
  async authenticateJwtToken(socket, conversationsService, jwtToken) {
    interface VerifiedUser {
      id: number;
      iat: number;
      exp: number;
    }

    const usersService = await strapi
      .plugin('users-permissions')
      .service('jwt');

    let verifiedUser: VerifiedUser;

    console.log('token', jwtToken);

    try {
      verifiedUser = await usersService.verify(jwtToken);
    } catch (e) {
      socket.emit(SocketResponseEmit.AUTHENTICATION_ERROR, 'Invalid token');
      return;
    }

    const user = await conversationsService.getUserById(verifiedUser.id);
    console.log('verified', verifiedUser, user);

    if (!user) {
      socket.emit(
        SocketResponseEmit.AUTHENTICATION_ERROR,
        'User associated with token not found'
      );
      return;
    }

    return user.id;
  },

  /** Returns all conversations of a user with last message for preview purposes */
  async getUserConversations(user_id) {
    // @todo without "any", there recently appears a strange type error
    const conversations = (await (strapi.entityService.findMany as any)(
      'api::conversation.conversation',
      {
        populate: {
          users: true,
          messages: {
            fields: ['id'],
            sort: {
              createdAt: 'desc',
            },
            limit: 1,
          },
        },
        filters: {
          $or: [{ users: user_id }],
        },
      }
    )) as Conversation[];

    return conversations;
  },

  async getUserById(user_id) {
    const user = (await strapi
      .documents('plugin::users-permissions.user')
      .findOne({
        documentId: user_id.toString(),
      })) as unknown as User;

    return user;
  },

  async getConversation(conversation_id) {
    const conversation = (await (strapi.entityService.findOne as any)(
      'api::conversation.conversation',
      conversation_id,
      {
        populate: {
          messages: {
            sort: {
              createdAt: 'asc',
            },
            populate: {
              sender: true,
              messageType: {
                populate: {
                  booking: {
                    populate: {
                      resource: {
                        populate: {
                          media: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }
    )) as Conversation;

    return conversation;
  },

  async getConversationBetweenUsers(user_id_a, user_id_b) {
    if (!user_id_a || !user_id_b) return;

    const conversation = (await strapi
      .documents('api::conversation.conversation')
      .findMany({
        fields: ['id'],
        filters: {
          $and: [
            { users: { documentId: user_id_a.toString() } },
            { users: { documentId: user_id_b.toString() } },
          ],
        },
      })) as unknown as Conversation[];

    return conversation[0] ?? undefined;
  },

  async getUserMessages(user_id) {
    const messages = (await strapi.documents('api::message.message').findMany({
      populate: {
        sender: true,
        conversation: true,
        messageType: true,
      },
      filters: {
        sender: { documentId: user_id.toString() },
      },
    })) as unknown as Message[];

    return messages;
  },

  async saveMessage(message) {
    let savedMessage: Message | undefined;

    try {
      savedMessage = (await strapi.documents('api::message.message').create({
        data: message as any,
        populate: {
          sender: {
            fields: ['id'],
          },
          messageType: true,
        },
      })) as unknown as Message;
    } catch (error) {
      console.log('Error saving new message', error, message);
    }

    return savedMessage;
  },

  async addBookingMessage(booking) {
    // Find conversation between booking.customer and booking.resourceOwner
    // if none exists, create one.
    const { customer, resourceOwner } = booking;

    if (
      !customer ||
      typeof customer.id === 'undefined' ||
      !resourceOwner ||
      typeof resourceOwner.id === 'undefined'
    ) {
      // @todo throw actual error
      return false;
    }

    let conversation = await this.getConversationBetweenUsers(
      customer.id,
      resourceOwner.id
    );

    if (!conversation) {
      conversation = (await strapi
        .documents('api::conversation.conversation')
        .create({
          data: {
            users: [booking.customer.id, booking.resourceOwner.id],
          },
        })) as unknown as Conversation;
    }

    // Add message of BookingEventMessage type to inform users
    // about referenced booking
    // @todo If socket.io is running, this should trigger a .send
    // However, this requires a modification of bootstrap.ts
    const bookingMessage = await this.saveMessage({
      conversation,
      messageType: [
        {
          __component: MessageTypeComponent.BOOKING_EVENT_MESSAGE_TYPE,
          booking,
        } satisfies BookingEventMessageType,
      ],
    });

    return bookingMessage;
  },
});
