import React, {useCallback, useEffect, useRef, useState} from 'react';
import {FlatList, Keyboard, Pressable, StyleSheet, Text, TextInput, View} from 'react-native';
import {useQuery} from '@tanstack/react-query';
import {useTheme} from '@theme/index';
import {ConsultMessage} from '@api/types';
import {consultApi} from '@api/consult';
import {consultSocket, generateId} from '@ws/socket';
import {useAuthStore} from '@store/auth';
import {formatTime} from '@utils/date';
import {DocPicker} from '@components/DocPicker';

interface ChatPanelProps {
  sessionId: string;
  peerName: string;
}

interface PendingMessage extends ConsultMessage {
  pending?: boolean;
}

export function ChatPanel({sessionId, peerName}: ChatPanelProps): React.JSX.Element {
  const {colors, spacing, radius} = useTheme();
  const myId = useAuthStore(s => s.user?.id);
  const [messages, setMessages] = useState<PendingMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [attachIds, setAttachIds] = useState<string[]>([]);
  const [showAttach, setShowAttach] = useState(false);
  const [peerTyping, setPeerTyping] = useState(false);
  const listRef = useRef<FlatList<PendingMessage>>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const historyQuery = useQuery({
    queryKey: ['consult-messages', sessionId],
    queryFn: () => consultApi.messages(sessionId, {limit: 50}),
  });

  useEffect(() => {
    if (historyQuery.data) {
      setMessages(historyQuery.data);
    }
  }, [historyQuery.data]);

  useEffect(() => {
    const unsubMessage = consultSocket.on('chat.message', payload => {
      if (payload.session_id !== sessionId) return;
      setMessages(prev => {
        // dedupe against our own optimistic send by client_msg_id
        const existingIdx = prev.findIndex(m => m.client_msg_id === payload.client_msg_id);
        if (existingIdx >= 0) {
          const next = [...prev];
          next[existingIdx] = payload;
          return next;
        }
        return [...prev, payload];
      });
    });
    const unsubTyping = consultSocket.on('chat.typing', payload => {
      if (payload.session_id !== sessionId) return;
      setPeerTyping(payload.is_typing);
    });
    const unsubRead = consultSocket.on('chat.read', payload => {
      if (payload.session_id !== sessionId) return;
      setMessages(prev =>
        prev.map(m => (m.id <= payload.up_to_message_id ? {...m, state: 'read'} : m)),
      );
    });
    return () => {
      unsubMessage();
      unsubTyping();
      unsubRead();
    };
  }, [sessionId]);

  const sendMessage = useCallback(() => {
    const body = draft.trim();
    const documentId = attachIds[0];
    if (!body && !documentId) return;
    const clientMsgId = generateId();
    const optimistic: PendingMessage = {
      id: clientMsgId,
      session_id: sessionId,
      client_msg_id: clientMsgId,
      sender_id: myId ?? 'me',
      body: body || undefined,
      document_id: documentId,
      state: 'sent',
      created_at: new Date().toISOString(),
      pending: true,
    };
    setMessages(prev => [...prev, optimistic]);
    consultSocket.send('chat.send', {session_id: sessionId, client_msg_id: clientMsgId, body: body || undefined, document_id: documentId});
    setDraft('');
    setAttachIds([]);
    setShowAttach(false);
    consultSocket.send('chat.typing', {session_id: sessionId, is_typing: false});
    requestAnimationFrame(() => listRef.current?.scrollToEnd({animated: true}));
  }, [draft, attachIds, sessionId, myId]);

  const onChangeDraft = (text: string) => {
    setDraft(text);
    consultSocket.send('chat.typing', {session_id: sessionId, is_typing: text.length > 0});
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      consultSocket.send('chat.typing', {session_id: sessionId, is_typing: false});
    }, 2000);
  };

  return (
    <View style={{flex: 1}}>
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={m => m.client_msg_id}
        contentContainerStyle={{padding: spacing.md, gap: 8}}
        onContentSizeChange={() => listRef.current?.scrollToEnd({animated: false})}
        renderItem={({item}) => {
          const mine = item.sender_id === myId;
          return (
            <View style={[styles.bubbleRow, {justifyContent: mine ? 'flex-end' : 'flex-start'}]}>
              <View
                style={[
                  styles.bubble,
                  {
                    backgroundColor: mine ? colors.primary : colors.bgSubtle,
                    borderRadius: radius.md,
                    borderBottomRightRadius: mine ? 4 : radius.md,
                    borderBottomLeftRadius: mine ? radius.md : 4,
                  },
                ]}>
                {item.document_id && (
                  <Text style={{color: mine ? colors.onPrimary : colors.text, fontSize: 12.5, marginBottom: item.body ? 4 : 0}}>
                    📎 Attached document
                  </Text>
                )}
                {item.body && (
                  <Text style={{color: mine ? colors.onPrimary : colors.text, fontSize: 14}}>{item.body}</Text>
                )}
                <View style={styles.metaRow}>
                  <Text style={{fontSize: 10, color: mine ? 'rgba(255,255,255,0.75)' : colors.textFaint}}>
                    {formatTime(item.created_at)}
                  </Text>
                  {mine && (
                    <Text style={{fontSize: 10, color: item.state === 'read' ? colors.accent : 'rgba(255,255,255,0.75)', marginLeft: 4}}>
                      {item.pending ? '⏳' : item.state === 'read' ? '✓✓' : item.state === 'delivered' ? '✓✓' : '✓'}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          );
        }}
      />

      {peerTyping && (
        <Text style={{fontSize: 11.5, color: colors.textMuted, paddingHorizontal: spacing.md, paddingBottom: 4}}>
          {peerName} is typing…
        </Text>
      )}

      {showAttach && (
        <View style={{paddingHorizontal: spacing.md}}>
          <DocPicker selectedIds={attachIds} onChange={setAttachIds} multiple={false} />
        </View>
      )}

      <View style={[styles.inputRow, {borderTopColor: colors.border, paddingHorizontal: spacing.sm}]}>
        <Pressable onPress={() => setShowAttach(v => !v)} style={{padding: 8}}>
          <Text style={{fontSize: 20}}>📎</Text>
        </Pressable>
        <TextInput
          value={draft}
          onChangeText={onChangeDraft}
          placeholder="Type a message"
          placeholderTextColor={colors.textFaint}
          multiline
          style={{flex: 1, maxHeight: 100, color: colors.text, fontSize: 14, paddingVertical: 8}}
        />
        <Pressable
          onPress={() => {
            sendMessage();
            Keyboard.dismiss();
          }}
          style={[styles.sendBtn, {backgroundColor: colors.primary, borderRadius: radius.pill}]}>
          <Text style={{color: colors.onPrimary, fontWeight: '700'}}>Send</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bubbleRow: {flexDirection: 'row'},
  bubble: {maxWidth: '78%', paddingHorizontal: 12, paddingVertical: 8},
  metaRow: {flexDirection: 'row', justifyContent: 'flex-end', marginTop: 3},
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: 6,
  },
  sendBtn: {paddingHorizontal: 16, paddingVertical: 8, marginLeft: 4, marginBottom: 4},
});
