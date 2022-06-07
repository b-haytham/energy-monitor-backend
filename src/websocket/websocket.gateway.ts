import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { WebsocketService } from './websocket.service';
import { Logger, UsePipes } from '@nestjs/common';
import { AuthenticateDto } from './dto/authenticate.dto';
import { Server, Socket } from 'socket.io';
import { WsValidationPipe } from './ws-validation.pipe';

@WebSocketGateway({ cors: true })
export class WebsocketGateway {
  private readonly logger = new Logger(WebSocketGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(private readonly websocketService: WebsocketService) {}

  @UsePipes(new WsValidationPipe())
  @SubscribeMessage('authenticate')
  async create(
    @MessageBody() authenticateDto: AuthenticateDto,
    @ConnectedSocket() socket: Socket,
  ) {
    try {
      await this.websocketService.authenticate(socket, authenticateDto);
    } catch (error) {
      throw new WsException(error.message);
    }
  }
}
