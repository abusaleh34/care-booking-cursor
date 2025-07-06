import { Repository } from 'typeorm';
import { Conversation } from '../../database/entities/conversation.entity';
import { Message } from '../../database/entities/message.entity';
import { User } from '../../database/entities/user.entity';
import { ServiceProvider } from '../../database/entities/service-provider.entity';
import { RealtimeGateway } from '../../websocket/websocket.gateway';
import { CreateConversationDto, MessagesQueryDto, SendMessageDto } from '../dto/provider.dto';
export declare class ProviderMessagingService {
    private readonly conversationRepository;
    private readonly messageRepository;
    private readonly userRepository;
    private readonly providerRepository;
    private readonly realtimeGateway;
    constructor(conversationRepository: Repository<Conversation>, messageRepository: Repository<Message>, userRepository: Repository<User>, providerRepository: Repository<ServiceProvider>, realtimeGateway: RealtimeGateway);
    getConversations(providerId: string): Promise<Conversation[]>;
    getConversationById(providerId: string, conversationId: string): Promise<Conversation>;
    createConversation(providerId: string, createConversationDto: CreateConversationDto): Promise<Conversation>;
    getMessages(providerId: string, conversationId: string, query: MessagesQueryDto): Promise<{
        messages: Message[];
        total: number;
        page: number;
        limit: number;
    }>;
    addMessage(providerId: string, sendMessageDto: SendMessageDto): Promise<Message>;
    markMessagesAsRead(providerId: string, conversationId: string): Promise<void>;
    getUnreadMessageCount(providerId: string): Promise<number>;
    getConversationStats(providerId: string): Promise<any>;
    searchConversations(providerId: string, searchTerm: string): Promise<Conversation[]>;
    markAllMessagesAsRead(providerId: string): Promise<void>;
    archiveConversation(providerId: string, conversationId: string): Promise<void>;
}
