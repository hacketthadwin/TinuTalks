import React from 'react';
import { View, Text, ActivityIndicator, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ChatBubble from './ChatBubble';

interface ChatMessage {
  type: 'user' | 'bot';
  message: string;
}

interface BottomSheetContentProps {
  tinuLoading: boolean;
  tinuData: any;
  chatInput: string;
  chatHistory: ChatMessage[];
  onInputChange: (text: string) => void;
  onSendMessage: () => void;
  styles: any;
}

const BottomSheetContent = ({
  tinuLoading,
  tinuData,
  chatInput,
  chatHistory,
  onInputChange,
  onSendMessage,
  styles
}: BottomSheetContentProps) => {
  if (tinuLoading) {
    return (
      <View style={styles.sheetCentered}>
        <ActivityIndicator size="large" color="#4A90A4" />
        <Text style={styles.sheetLoadingText}>Tinu is thinking...</Text>
      </View>
    );
  }

  if (!tinuData) {
    return (
      <View style={styles.sheetCentered}>
        <Text style={styles.sheetEmptyText}>Tap &quot;Ask Tinu&quot; to start!</Text>
      </View>
    );
  }

  return (
    <View style={styles.bottomSheetContent}>
      {/* Header with conversation starters */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.conversationStartersContainer}
      >
        <View style={styles.conversationStarter}>
          <Text style={styles.conversationStarterText}>
            Aim for natural conversations
          </Text>
          <Text style={styles.conversationStarterExample}>
            &quot;Did you know when Geeta Aunty and I were young, there was one thing we both liked&quot;, or &quot;How was school today&quot;
          </Text>
        </View>
        <View style={styles.conversationStarter}>
          <Text style={styles.conversationStarterText}>
            Talk about other activities
          </Text>
          <Text style={styles.conversationStarterExample}>
            Look what I drew today!&quot; or &quot;Do you want to play with blocks?&quot; or &quot;This reminds me of our cooking!&quot;
          </Text>
        </View>
      </ScrollView>

      {/* Share context section */}
      <View style={styles.shareContextSection}>
        <Text style={styles.shareContextTitle}>Share more context of Arya</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.contextChipsContainer}
        >
          <View style={styles.contextChip}>
            <Text style={styles.contextChipEmoji}>🍽️</Text>
            <Text style={styles.contextChipText}>Arya doesn&apos;t want to talk about foods</Text>
          </View>
          <View style={styles.contextChip}>
            <Text style={styles.contextChipEmoji}>🪑</Text>
            <Text style={styles.contextChipText}>Arya doesn&apos;t want to sit in one place</Text>
          </View>
        </ScrollView>
      </View>

      {/* Chat messages */}
      <ScrollView style={styles.chatContainer}>
        {chatHistory.map((msg, index) => (
          <ChatBubble key={index} type={msg.type} message={msg.message} />
        ))}
      </ScrollView>

      {/* Input section */}
      <View style={styles.inputSection}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Ask me anything..."
            placeholderTextColor="#999"
            value={chatInput}
            onChangeText={onInputChange}
            multiline
          />
          <TouchableOpacity 
            style={styles.sendButton}
            onPress={onSendMessage}
            disabled={!chatInput.trim()}
          >
            <Ionicons 
              name="arrow-up-circle" 
              size={40} 
              color={chatInput.trim() ? "#4A90A4" : "#ccc"} 
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default BottomSheetContent;
