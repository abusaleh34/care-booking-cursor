import { Conversation } from './conversation.entity';
import { User } from './user.entity';
export declare enum MessageType {
    TEXT = "text",
    IMAGE = "image",
    FILE = "file"
}
export declare class Message {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    message_type: MessageType;
    file_url: string;
    is_read: boolean;
    sent_at: Date;
    conversation: Conversation;
    sender: User;
}
