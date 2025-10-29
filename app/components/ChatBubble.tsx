import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ChatBubbleProps {
  type: 'user' | 'bot';
  message: string;
  key?: number;
}

const ChatBubble = ({ type, message }: ChatBubbleProps) => {
  return (
    <View style={[styles.bubbleContainer, type === 'user' && styles.userBubbleContainer]}>
      {type === 'bot' && (
        <View style={styles.botAvatar}>
          <Text>🤓</Text>
        </View>
      )}
      <View style={[
        styles.bubble, 
        type === 'user' ? styles.userBubble : styles.botBubble,
        type === 'bot' && styles.botBubbleShape
      ]}>
        <Text style={[styles.text, type === 'user' && styles.userText]}>
          {message}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bubbleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  userBubbleContainer: {
    justifyContent: 'flex-end',
  },
  botAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: '#4A90A4',
    borderTopRightRadius: 4,
  },
  botBubble: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 4,
  },
  botBubbleShape: {
    borderBottomLeftRadius: 4,
  },
  text: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  userText: {
    color: '#fff',
  },
});

export default ChatBubble;