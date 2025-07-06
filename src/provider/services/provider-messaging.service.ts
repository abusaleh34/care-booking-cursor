import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from '../../database/entities/conversation.entity';
import { Message, MessageType } from '../../database/entities/message.entity';
import { User } from '../../database/entities/user.entity';
import { ServiceProvider } from '../../database/entities/service-provider.entity';
import { RealtimeGateway } from '../../websocket/websocket.gateway';
import { CreateConversationDto, MessagesQueryDto, SendMessageDto } from '../dto/provider.dto';

@Injectable()
export class ProviderMessagingService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(ServiceProvider)
    private readonly providerRepository: Repository<ServiceProvider>,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  // ========== CONVERSATION MANAGEMENT ==========

  async getConversations(providerId: string): Promise<Conversation[]> {
    return await this.conversationRepository.find({
      where: { provider_id: providerId },
      relations: ['customer', 'customer.profile', 'booking', 'messages'],
      order: { created_at: 'DESC' },
    });
  }

  async getConversationById(providerId: string, conversationId: string): Promise<Conversation> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId, provider_id: providerId },
      relations: ['customer', 'customer.profile', 'booking', 'messages'],
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }

  async createConversation(
    providerId: string,
    createConversationDto: CreateConversationDto,
  ): Promise<Conversation> {
    // Verify customer exists
    const customer = await this.userRepository.findOne({
      where: { id: createConversationDto.customerId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Check if conversation already exists
    const existingConversation = await this.conversationRepository.findOne({
      where: {
        customer_id: createConversationDto.customerId,
        provider_id: providerId,
        ...(createConversationDto.bookingId && { booking_id: createConversationDto.bookingId }),
      },
    });

    if (existingConversation) {
      // Add initial message to existing conversation
      await this.addMessage(providerId, {
        conversationId: existingConversation.id,
        content: createConversationDto.initialMessage,
      });
      return existingConversation;
    }

    // Create new conversation
    const conversation = this.conversationRepository.create({
      customer_id: createConversationDto.customerId,
      provider_id: providerId,
      booking_id: createConversationDto.bookingId,
    });

    const savedConversation = await this.conversationRepository.save(conversation);

    // Add initial message
    await this.addMessage(providerId, {
      conversationId: savedConversation.id,
      content: createConversationDto.initialMessage,
    });

    return await this.getConversationById(providerId, savedConversation.id);
  }

  // ========== MESSAGE MANAGEMENT ==========

  async getMessages(
    providerId: string,
    conversationId: string,
    query: MessagesQueryDto,
  ): Promise<{ messages: Message[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 20 } = query;

    // Verify conversation belongs to provider
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId, provider_id: providerId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const queryBuilder = this.messageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .leftJoinAndSelect('sender.profile', 'profile')
      .where('message.conversation_id = :conversationId', { conversationId });

    const total = await queryBuilder.getCount();

    const messages = await queryBuilder
      .orderBy('message.sent_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return { messages, total, page, limit };
  }

  async addMessage(providerId: string, sendMessageDto: SendMessageDto): Promise<Message> {
    // Verify conversation belongs to provider
    const conversation = await this.conversationRepository.findOne({
      where: { id: sendMessageDto.conversationId, provider_id: providerId },
      relations: ['customer'],
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Get provider user ID
    const provider = await this.providerRepository.findOne({
      where: { id: providerId },
      relations: ['user'],
    });

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    const message = this.messageRepository.create({
      conversation_id: sendMessageDto.conversationId,
      sender_id: provider.user.id,
      content: sendMessageDto.content,
      message_type: sendMessageDto.messageType || MessageType.TEXT,
      file_url: sendMessageDto.fileUrl,
    });

    const savedMessage = await this.messageRepository.save(message);

    // Get the complete message with relations
    const completeMessage = await this.messageRepository.findOne({
      where: { id: savedMessage.id },
      relations: ['sender', 'sender.profile'],
    });

    // Send real-time notification to customer via WebSocket
    // TODO: Add proper message notification method to RealtimeGateway

    return completeMessage;
  }

  async markMessagesAsRead(providerId: string, conversationId: string): Promise<void> {
    // Verify conversation belongs to provider
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId, provider_id: providerId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Mark all messages in conversation as read (except provider's own messages)
    await this.messageRepository
      .createQueryBuilder()
      .update(Message)
      .set({ is_read: true })
      .where('conversation_id = :conversationId', { conversationId })
      .andWhere('sender_id != :senderId', {
        senderId: (
          await this.providerRepository.findOne({
            where: { id: providerId },
            relations: ['user'],
          })
        ).user.id,
      })
      .execute();
  }

  // ========== CONVERSATION STATISTICS ==========

  async getUnreadMessageCount(providerId: string): Promise<number> {
    const provider = await this.providerRepository.findOne({
      where: { id: providerId },
      relations: ['user'],
    });

    if (!provider) {
      return 0;
    }

    // Count unread messages in all provider's conversations
    const unreadCount = await this.messageRepository
      .createQueryBuilder('message')
      .innerJoin('message.conversation', 'conversation')
      .where('conversation.provider_id = :providerId', { providerId })
      .andWhere('message.sender_id != :senderId', { senderId: provider.user.id })
      .andWhere('message.is_read = false')
      .getCount();

    return unreadCount;
  }

  async getConversationStats(providerId: string): Promise<any> {
    const totalConversations = await this.conversationRepository.count({
      where: { provider_id: providerId },
    });

    const activeConversations = await this.conversationRepository
      .createQueryBuilder('conversation')
      .innerJoin('conversation.messages', 'message')
      .where('conversation.provider_id = :providerId', { providerId })
      .andWhere('message.sent_at >= :since', {
        since: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
      })
      .getCount();

    const unreadMessages = await this.getUnreadMessageCount(providerId);

    return {
      totalConversations,
      activeConversations,
      unreadMessages,
      responseRate: activeConversations > 0 ? (activeConversations / totalConversations) * 100 : 0,
    };
  }

  // ========== CONVERSATION SEARCH ==========

  async searchConversations(providerId: string, searchTerm: string): Promise<Conversation[]> {
    return await this.conversationRepository
      .createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.customer', 'customer')
      .leftJoinAndSelect('customer.profile', 'profile')
      .leftJoinAndSelect('conversation.messages', 'message')
      .where('conversation.provider_id = :providerId', { providerId })
      .andWhere(
        '(LOWER(profile.firstName) LIKE LOWER(:searchTerm) OR LOWER(profile.lastName) LIKE LOWER(:searchTerm) OR LOWER(message.content) LIKE LOWER(:searchTerm))',
        { searchTerm: `%${searchTerm}%` },
      )
      .orderBy('conversation.created_at', 'DESC')
      .getMany();
  }

  // ========== BULK OPERATIONS ==========

  async markAllMessagesAsRead(providerId: string): Promise<void> {
    const provider = await this.providerRepository.findOne({
      where: { id: providerId },
      relations: ['user'],
    });

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    // Mark all messages in all provider's conversations as read
    await this.messageRepository
      .createQueryBuilder()
      .update(Message)
      .set({ is_read: true })
      .where('conversation_id IN (SELECT id FROM conversations WHERE provider_id = :providerId)', {
        providerId,
      })
      .andWhere('sender_id != :senderId', { senderId: provider.user.id })
      .execute();
  }

  async archiveConversation(providerId: string, conversationId: string): Promise<void> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId, provider_id: providerId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // TODO: Implement conversation archiving
    // For now, we'll just mark all messages as read
    await this.markMessagesAsRead(providerId, conversationId);
  }
}
