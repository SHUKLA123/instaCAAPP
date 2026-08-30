import React, {useEffect, useRef, useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {
  AudioProfileType,
  AudioScenarioType,
  ChannelProfileType,
  ClientRoleType,
  createAgoraRtcEngine,
  IRtcEngine,
} from 'react-native-agora';
import {useTheme} from '@theme/index';
import {consultApi} from '@api/consult';
import {Avatar} from '@components/Avatar';
import {formatDuration} from '@utils/date';

interface CallPanelProps {
  sessionId: string;
  peerName: string;
  peerAvatarUrl?: string;
}

/**
 * Audio-only Agora call surface. Video is never enabled anywhere in this app:
 * `enableLocalVideo(false)` is called explicitly and no remote video view is
 * ever rendered. Call duration shown here is a local UX clock only — the
 * billing meter in LiveConsultScreen's header is the only source of truth for
 * money, driven by `consult.tick` over the WS, never by this component.
 */
export function CallPanel({sessionId, peerName, peerAvatarUrl}: CallPanelProps): React.JSX.Element {
  const {colors, spacing, radius} = useTheme();
  const engineRef = useRef<IRtcEngine | null>(null);
  const [joined, setJoined] = useState(false);
  const [muted, setMuted] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [callSeconds, setCallSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    async function join() {
      try {
        const tokenRes = await consultApi.callToken(sessionId);
        if (cancelled) return;

        const engine = createAgoraRtcEngine();
        engineRef.current = engine;
        engine.initialize({appId: tokenRes.agora_app_id, channelProfile: ChannelProfileType.ChannelProfileCommunication});

        // Audio-only, always. No video is ever enabled in this app.
        engine.enableAudio();
        engine.disableVideo();
        engine.enableLocalVideo(false);
        engine.setAudioProfile(AudioProfileType.AudioProfileSpeechStandard, AudioScenarioType.AudioScenarioChatroom);
        engine.setDefaultAudioRouteToSpeakerphone(true);

        engine.registerEventHandler({
          onJoinChannelSuccess: () => {
            if (cancelled) return;
            setJoined(true);
            timer = setInterval(() => setCallSeconds(s => s + 1), 1000);
          },
          onError: (err: number) => {
            if (cancelled) return;
            setError(`Call connection error (${err}). Retrying…`);
          },
        });

        engine.joinChannel(tokenRes.token, tokenRes.channel, tokenRes.uid, {
          clientRoleType: ClientRoleType.ClientRoleBroadcaster,
        });
      } catch {
        if (!cancelled) setError('Could not connect the call. Please check your connection.');
      }
    }

    join();

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      const engine = engineRef.current;
      if (engine) {
        engine.leaveChannel();
        engine.release();
        engineRef.current = null;
      }
    };
  }, [sessionId]);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    engineRef.current?.muteLocalAudioStream(next);
  };

  const toggleSpeaker = () => {
    const next = !speakerOn;
    setSpeakerOn(next);
    engineRef.current?.setEnableSpeakerphone(next);
  };

  return (
    <View style={[styles.container, {padding: spacing.xl}]}>
      <Avatar uri={peerAvatarUrl} name={peerName} size={120} />
      <Text style={{fontSize: 20, fontWeight: '700', color: colors.text, marginTop: spacing.md}}>{peerName}</Text>
      <Text style={{fontSize: 13, color: joined ? colors.success : colors.textMuted, marginTop: 4}}>
        {joined ? 'Connected' : 'Connecting…'}
      </Text>
      <Text style={{fontSize: 28, fontWeight: '700', color: colors.text, marginTop: spacing.sm, fontVariant: ['tabular-nums']}}>
        {formatDuration(callSeconds)}
      </Text>
      {error && <Text style={{color: colors.danger, fontSize: 12.5, marginTop: spacing.sm, textAlign: 'center'}}>{error}</Text>}

      <View style={styles.controlsRow}>
        <CallButton icon={muted ? '🔇' : '🎙️'} label={muted ? 'Unmute' : 'Mute'} active={muted} onPress={toggleMute} colors={colors} radius={radius} />
        <CallButton icon={speakerOn ? '🔊' : '📱'} label="Speaker" active={speakerOn} onPress={toggleSpeaker} colors={colors} radius={radius} />
      </View>
    </View>
  );
}

function CallButton({
  icon,
  label,
  active,
  onPress,
  colors,
  radius,
}: {
  icon: string;
  label: string;
  active: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
  radius: ReturnType<typeof useTheme>['radius'];
}): React.JSX.Element {
  return (
    <Pressable onPress={onPress} style={styles.controlBtnWrap}>
      <View
        style={[
          styles.controlBtn,
          {backgroundColor: active ? colors.primary : colors.bgSubtle, borderRadius: radius.pill},
        ]}>
        <Text style={{fontSize: 22}}>{icon}</Text>
      </View>
      <Text style={{fontSize: 11, color: colors.textMuted, marginTop: 4}}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  controlsRow: {flexDirection: 'row', gap: 28, marginTop: 40},
  controlBtnWrap: {alignItems: 'center'},
  controlBtn: {width: 60, height: 60, alignItems: 'center', justifyContent: 'center'},
});
