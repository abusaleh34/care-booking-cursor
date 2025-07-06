"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderMessagingService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const conversation_entity_1 = require("../../database/entities/conversation.entity");
const message_entity_1 = require("../../database/entities/message.entity");
const user_entity_1 = require("../../database/entities/user.entity");
const service_provider_entity_1 = require("../../database/entities/service-provider.entity");
const websocket_gateway_1 = require("../../websocket/websocket.gateway");
let ProviderMessagingService = class ProviderMessagingService {
    constructor(conversationRepository, messageRepository, userRepository, providerRepository, realtimeGateway) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
        this.providerRepository = providerRepository;
        this.realtimeGateway = realtimeGateway;
    }
    async getConversations(providerId) {
        return await this.conversationRepository.find({
            where: { provider_id: providerId },
            relations: ['customer', 'customer.profile', 'booking', 'messages'],
            order: { created_at: 'DESC' },
        });
    }
    async getConversationById(providerId, conversationId) {
        const conversation = await this.conversationRepository.findOne({
            where: { id: conversationId, provider_id: providerId },
            relations: ['customer', 'customer.profile', 'booking', 'messages'],
        });
        if (!conversation) {
            throw new common_1.NotFoundException('Conversation not found');
        }
        return conversation;
    }
    async createConversation(providerId, createConversationDto) {
        const customer = await this.userRepository.findOne({
            where: { id: createConversationDto.customerId },
        });
        if (!customer) {
            throw new common_1.NotFoundException('Customer not found');
        }
        const existingConversation = await this.conversationRepository.findOne({
            where: {
                customer_id: createConversationDto.customerId,
                provider_id: providerId,
                ...(createConversationDto.bookingId && { booking_id: createConversationDto.bookingId }),
            },
        });
        if (existingConversation) {
            await this.addMessage(providerId, {
                conversationId: existingConversation.id,
                content: createConversationDto.initialMessage,
            });
            return existingConversation;
        }
        const conversation = this.conversationRepository.create({
            customer_id: createConversationDto.customerId,
            provider_id: providerId,
            booking_id: createConversationDto.bookingId,
        });
        const savedConversation = await this.conversationRepository.save(conversation);
        await this.addMessage(providerId, {
            conversationId: savedConversation.id,
            content: createConversationDto.initialMessage,
        });
        return await this.getConversationById(providerId, savedConversation.id);
    }
    async getMessages(providerId, conversationId, query) {
        const { page = 1, limit = 20 } = query;
        const conversation = await this.conversationRepository.findOne({
            where: { id: conversationId, provider_id: providerId },
        });
        if (!conversation) {
            throw new common_1.NotFoundException('Conversation not found');
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
    async addMessage(providerId, sendMessageDto) {
        const conversation = await this.conversationRepository.findOne({
            where: { id: sendMessageDto.conversationId, provider_id: providerId },
            relations: ['customer'],
        });
        if (!conversation) {
            throw new common_1.NotFoundException('Conversation not found');
        }
        const provider = await this.providerRepository.findOne({
            where: { id: providerId },
            relations: ['user'],
        });
        if (!provider) {
            throw new common_1.NotFoundException('Provider not found');
        }
        const message = this.messageRepository.create({
            conversation_id: sendMessageDto.conversationId,
            sender_id: provider.user.id,
            content: sendMessageDto.content,
            message_type: sendMessageDto.messageType || message_entity_1.MessageType.TEXT,
            file_url: sendMessageDto.fileUrl,
        });
        const savedMessage = await this.messageRepository.save(message);
        const completeMessage = await this.messageRepository.findOne({
            where: { id: savedMessage.id },
            relations: ['sender', 'sender.profile'],
        });
        return completeMessage;
    }
    async markMessagesAsRead(providerId, conversationId) {
        const conversation = await this.conversationRepository.findOne({
            where: { id: conversationId, provider_id: providerId },
        });
        if (!conversation) {
            throw new common_1.NotFoundException('Conversation not found');
        }
        await this.messageRepository
            .createQueryBuilder()
            .update(message_entity_1.Message)
            .set({ is_read: true })
            .where('conversation_id = :conversationId', { conversationId })
            .andWhere('sender_id != :senderId', {
            senderId: (await this.providerRepository.findOne({
                where: { id: providerId },
                relations: ['user'],
            })).user.id,
        })
            .execute();
    }
    async getUnreadMessageCount(providerId) {
        const provider = await this.providerRepository.findOne({
            where: { id: providerId },
            relations: ['user'],
        });
        if (!provider) {
            return 0;
        }
        const unreadCount = await this.messageRepository
            .createQueryBuilder('message')
            .innerJoin('message.conversation', 'conversation')
            .where('conversation.provider_id = :providerId', { providerId })
            .andWhere('message.sender_id != :senderId', { senderId: provider.user.id })
            .andWhere('message.is_read = false')
            .getCount();
        return unreadCount;
    }
    async getConversationStats(providerId) {
        const totalConversations = await this.conversationRepository.count({
            where: { provider_id: providerId },
        });
        const activeConversations = await this.conversationRepository
            .createQueryBuilder('conversation')
            .innerJoin('conversation.messages', 'message')
            .where('conversation.provider_id = :providerId', { providerId })
            .andWhere('message.sent_at >= :since', {
            since: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
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
    async searchConversations(providerId, searchTerm) {
        return await this.conversationRepository
            .createQueryBuilder('conversation')
            .leftJoinAndSelect('conversation.customer', 'customer')
            .leftJoinAndSelect('customer.profile', 'profile')
            .leftJoinAndSelect('conversation.messages', 'message')
            .where('conversation.provider_id = :providerId', { providerId })
            .andWhere('(LOWER(profile.firstName) LIKE LOWER(:searchTerm) OR LOWER(profile.lastName) LIKE LOWER(:searchTerm) OR LOWER(message.content) LIKE LOWER(:searchTerm))', { searchTerm: `%${searchTerm}%` })
            .orderBy('conversation.created_at', 'DESC')
            .getMany();
    }
    async markAllMessagesAsRead(providerId) {
        const provider = await this.providerRepository.findOne({
            where: { id: providerId },
            relations: ['user'],
        });
        if (!provider) {
            throw new common_1.NotFoundException('Provider not found');
        }
        await this.messageRepository
            .createQueryBuilder()
            .update(message_entity_1.Message)
            .set({ is_read: true })
            .where('conversation_id IN (SELECT id FROM conversations WHERE provider_id = :providerId)', {
            providerId,
        })
            .andWhere('sender_id != :senderId', { senderId: provider.user.id })
            .execute();
    }
    async archiveConversation(providerId, conversationId) {
        const conversation = await this.conversationRepository.findOne({
            where: { id: conversationId, provider_id: providerId },
        });
        if (!conversation) {
            throw new common_1.NotFoundException('Conversation not found');
        }
        await this.markMessagesAsRead(providerId, conversationId);
    }
};
exports.ProviderMessagingService = ProviderMessagingService;
exports.ProviderMessagingService = ProviderMessagingService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(conversation_entity_1.Conversation)),
    __param(1, (0, typeorm_1.InjectRepository)(message_entity_1.Message)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(3, (0, typeorm_1.InjectRepository)(service_provider_entity_1.ServiceProvider)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        websocket_gateway_1.RealtimeGateway])
], ProviderMessagingService);
//# sourceMappingURL=provider-messaging.service.js.map