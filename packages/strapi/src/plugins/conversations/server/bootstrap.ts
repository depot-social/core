import type { Core } from '@strapi/strapi';
import { ConversationsService } from './services/conversations-service';
import { Server, Socket } from 'socket.io';
import {
  ConversationOpenEventData,
  ConversationSendMessageEventData,
  Message,
  SocketRequestEvent,
  SocketResponseEmit,
  User,
  MessageTypeComponent,
} from '@depot/shared';

type SocketEventHandler<T = any> = (
  socket: Socket,
  conversationsService: ConversationsService,
  user_id: number,
  data: T
) => any;

const curriedHandleSocketEvent =
  (socket: Socket, conversationsService: ConversationsService) =>
  (eventHandler: SocketEventHandler) =>
  async (data: any) => {
    // Always authenticate jwt token on socket connection
    const user_id = await conversationsService.authenticateJwtToken(
      socket,
      conversationsService,
      socket.handshake.auth.jwtToken
    );

    if (!user_id) {
      return;
    }

    // Pass resolved user_id to event handler
    return eventHandler(socket, conversationsService, user_id, data);
  };

const handleConversationJoinEvent: SocketEventHandler = async (
  socket,
  conversationsService,
  user_id
) => {
  // Listening for a join connection
  const userConversations = await conversationsService.getUserConversations(
    Number(user_id)
  );

  // socket.join('bla'); // Adding the user to the group
  socket.emit(SocketResponseEmit.CONVERSATIONS, userConversations); // Sending a welcome message to the user
};

const handleSendUserMessageEvent: SocketEventHandler<
  ConversationSendMessageEventData
> = async (
  socket,
  conversationsService,
  user_id,
  { conversation_id, content }
) => {
  const message: Partial<Message> = {
    sender: Number(user_id) as unknown as User,
    conversation: Number(conversation_id),
    messageType: [
      {
        __component: MessageTypeComponent.USER_MESSAGE_TYPE,
        content,
      },
    ],
  };

  let savedMessage;

  try {
    savedMessage = await conversationsService.saveMessage(message);

    // Emit "new message" event to sender
    socket.emit(SocketResponseEmit.MESSAGE, savedMessage);

    // Emit "new message" event to the other user(s) in conversation (except sender, as of socket.io spec)
    socket
      .to(conversation_id.toString())
      .emit(SocketResponseEmit.MESSAGE, savedMessage);
  } catch (err) {
    console.log('Error saving message', err);
    savedMessage = '@todo error';
  }
};

const handleConversationOpenEvent: SocketEventHandler<
  ConversationOpenEventData
> = async (socket, conversationsService, user_id, { conversation_id }) => {
  const conversation = await conversationsService.getConversation(
    Number(conversation_id)
  );
  socket.join(conversation_id.toString());
  socket.emit(SocketResponseEmit.CONVERSATION_MESSAGES, conversation?.messages);
};

export default async ({ strapi }: { strapi: Core.Strapi }) => {
  const io = new Server(strapi.server.httpServer, {
    cors: {
      // @todo env PUBLIC_STRAPI_URL
      origin: 'http://127.0.0.1:3000',
      methods: ['GET', 'POST'],
      // allowedHeaders: ["my-custom-header"],
      credentials: true,
    },
  });

  const conversationsService: ConversationsService = await strapi
    .plugin('conversations')
    .service('conversationsService');

  io.on('connection', (socket) => {
    const handleSocketEvent = curriedHandleSocketEvent(
      socket,
      conversationsService
    );

    socket.on(
      SocketRequestEvent.JOIN,
      handleSocketEvent(handleConversationJoinEvent)
    );
    socket.on(
      SocketRequestEvent.SEND_MESSAGE,
      handleSocketEvent(handleSendUserMessageEvent)
    );
    socket.on(
      SocketRequestEvent.OPEN_CONVERSATION,
      handleSocketEvent(handleConversationOpenEvent)
    );
    // socket.onAny((event, ...args) => console.log(event, args))
  });
};
