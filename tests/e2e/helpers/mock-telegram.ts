export interface MockTelegramEvent {
  update_id: number;
  message: {
    message_id: number;
    from: { id: number; username: string };
    chat: { id: number; type: string };
    date: number;
    text: string;
  };
}

export function createMockTelegramWebhookPayload(chatId: number, commandText: string): MockTelegramEvent {
  return {
    update_id: 100001,
    message: {
      message_id: 1,
      from: { id: chatId, username: 'e2e_test_user' },
      chat: { id: chatId, type: 'private' },
      date: Math.floor(Date.now() / 1000),
      text: commandText,
    },
  };
}
