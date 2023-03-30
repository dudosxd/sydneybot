import type { CallbackQuery, CommonMessageBundle, Message, Update } from 'typegram';
import type { Deunionize, UnionKeys } from './deunionize';
type DistinctKeys<T extends object> = Exclude<UnionKeys<T>, keyof T>;
type Keyed<T extends object, K extends DistinctKeys<T>> = Record<K, {}> & Deunionize<Record<K, {}>, T>;
export type Filter<U extends Update> = (update: Update) => update is U;
export declare const message: <Ks extends ("entities" | "text" | "caption" | "caption_entities" | "animation" | "reply_markup" | "audio" | "document" | "photo" | "sticker" | "video" | "video_note" | "voice" | "poll" | "channel_chat_created" | "chat_shared" | "connected_website" | "delete_chat_photo" | "group_chat_created" | "invoice" | "left_chat_member" | "message_auto_delete_timer_changed" | "migrate_from_chat_id" | "migrate_to_chat_id" | "new_chat_members" | "new_chat_photo" | "new_chat_title" | "passport_data" | "proximity_alert_triggered" | "forum_topic_created" | "forum_topic_closed" | "forum_topic_reopened" | "pinned_message" | "successful_payment" | "supergroup_chat_created" | "user_shared" | "video_chat_scheduled" | "video_chat_started" | "video_chat_ended" | "video_chat_participants_invited" | "web_app_data" | "media_group_id" | "has_media_spoiler" | "forward_from" | "forward_from_chat" | "forward_from_message_id" | "forward_signature" | "forward_sender_name" | "forward_date" | "is_automatic_forward" | "reply_to_message" | "via_bot" | "edit_date" | "has_protected_content" | "author_signature" | "contact" | "dice" | "location" | "game" | "venue")[]>(...keys: Ks) => (update: Update) => update is Update.MessageUpdate<Keyed<Message, Ks[number]>>;
export declare const editedMessage: <Ks extends ("entities" | "text" | "caption" | "caption_entities" | "animation" | "audio" | "document" | "photo" | "sticker" | "video" | "video_note" | "voice" | "poll" | "media_group_id" | "has_media_spoiler" | "contact" | "dice" | "location" | "game" | "venue")[]>(...keys: Ks) => (update: Update) => update is Update.EditedMessageUpdate<Keyed<CommonMessageBundle, Ks[number]>>;
export declare const channelPost: <Ks extends ("entities" | "text" | "caption" | "caption_entities" | "animation" | "reply_markup" | "audio" | "document" | "photo" | "sticker" | "video" | "video_note" | "voice" | "poll" | "channel_chat_created" | "chat_shared" | "connected_website" | "delete_chat_photo" | "group_chat_created" | "invoice" | "left_chat_member" | "message_auto_delete_timer_changed" | "migrate_from_chat_id" | "migrate_to_chat_id" | "new_chat_members" | "new_chat_photo" | "new_chat_title" | "passport_data" | "proximity_alert_triggered" | "forum_topic_created" | "forum_topic_closed" | "forum_topic_reopened" | "pinned_message" | "successful_payment" | "supergroup_chat_created" | "user_shared" | "video_chat_scheduled" | "video_chat_started" | "video_chat_ended" | "video_chat_participants_invited" | "web_app_data" | "media_group_id" | "has_media_spoiler" | "forward_from" | "forward_from_chat" | "forward_from_message_id" | "forward_signature" | "forward_sender_name" | "forward_date" | "is_automatic_forward" | "reply_to_message" | "via_bot" | "edit_date" | "has_protected_content" | "author_signature" | "contact" | "dice" | "location" | "game" | "venue")[]>(...keys: Ks) => (update: Update) => update is Update.ChannelPostUpdate<Keyed<Message, Ks[number]>>;
export declare const editedChannelPost: <Ks extends ("entities" | "text" | "caption" | "caption_entities" | "animation" | "audio" | "document" | "photo" | "sticker" | "video" | "video_note" | "voice" | "poll" | "media_group_id" | "has_media_spoiler" | "contact" | "dice" | "location" | "game" | "venue")[]>(...keys: Ks) => (update: Update) => update is Update.EditedChannelPostUpdate<Keyed<CommonMessageBundle, Ks[number]>>;
export declare const callbackQuery: <Ks extends ("game_short_name" | "data")[]>(...keys: Ks) => (update: Update) => update is Update.CallbackQueryUpdate<Keyed<CallbackQuery, Ks[number]>>;
export declare const either: <Us extends Update[]>(...filters: { [UIdx in keyof Us]: Filter<Us[UIdx]>; }) => (update: Update) => update is Us[number];
export {};
//# sourceMappingURL=filters.d.ts.map