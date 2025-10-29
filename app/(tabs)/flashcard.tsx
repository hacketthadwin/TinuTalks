import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  Image,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import Constants from 'expo-constants';
import WavyBackground from '../components/Background';
// NOTE: Removed import of BottomSheetContent as chat logic is now local
// import BottomSheetContent from '../components/BottomSheetContent'; 

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// --- CONSTANTS ---
const API_BASE_URL = 'https://genai-images-4ea9c0ca90c8.herokuapp.com';
const THEME_COLORS = {
  DARK_BG: '#1a0a1a',
  PINK_ACCENT: '#FF6B9D',
  TEAL_ACCENT: '#4A90A4',
  LIGHT_BG: '#f5e6f0',
  WHITE: '#fff',
  GRAY: '#999',
  CARD_BG: '#4A90A4', // Default card background color
  LIGHT_GRAY: '#ddd', // Added for consistency with DYK screen styles
};
const CARD_MARGIN_HORIZONTAL = 16;
const CARD_WIDTH = SCREEN_WIDTH - (CARD_MARGIN_HORIZONTAL * 2);

interface ChatMessage {
  type: 'user' | 'tinu'; // Changed 'bot' to 'tinu' for consistency
  message: string;
}

interface FlashCard {
  card_id: string;
  topic: string;
  title: string;
  content: string;
  points?: string[];
  image_url?: string;
  source?: string;
  visual_elements?: {
    background_color?: string;
    bubble_type?: 'did-you-know' | 'normal';
    theme?: string;
  };
}

interface TinuResponseCard {
    text?: string;
    content?: string;
}

interface TinuResponseChip {
    text?: string;
    label?: string;
}

// --- NEW CHAT BUBBLE COMPONENT ---
const ChatBubble: React.FC<ChatMessage> = ({ type, message }) => (
  <View style={[styles.chatBubbleContainer, type === 'user' ? styles.userBubbleContainer : styles.tinuBubbleContainer]}>
    {type === 'tinu' && (
      <View style={styles.tinuAvatarSmall}>
        <Text style={styles.tinuEmojiSmall}>🤓</Text>
      </View>
    )}
    <View style={[styles.messageContent, type === 'user' ? styles.userMessageContent : styles.tinuMessageContent]}>
      <Text style={type === 'user' ? styles.userText : styles.botText}>
        {message}
      </Text>
    </View>
  </View>
);
// --- END CHAT BUBBLE COMPONENT ---


export default function FlashCardScreen() {
  const [flashCards, setFlashCards] = useState<FlashCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tinuData, setTinuData] = useState<{cards: TinuResponseCard[], chips: TinuResponseChip[], question: string} | null>(null);
  const [tinuLoading, setTinuLoading] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());
  
  // --- CHAT STATE & REFS ---
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const chatScrollViewRef = useRef<ScrollView>(null);
  // --- END CHAT STATE & REFS ---

  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['25%', '90%'], []);

  const handleSheetChanges = useCallback((index: number) => {
    // Add any logic here if you want to control blur/state when sheet changes
  }, []);

  useEffect(() => {
    fetchFlashCards();
  }, []);
  
  // --- CHAT UTILITY FUNCTIONS ---
  const scrollToBottom = () => {
    // Scroll timeout is often necessary for Native components to calculate the new content size
    setTimeout(() => {
      chatScrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };
  
  // Memoized function for Tinu's response simulation
  const fetchTinuResponse = useCallback(async (userQuery: string, currentTopic: string) => {
      // Simulate API call and delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockTinuResponse = `Tinu received your question: "${userQuery}". You are talking about the topic: "${currentTopic}". I recommend trying one of the suggested conversation starters!`;

      const tinuMessage: ChatMessage = { type: 'tinu', message: mockTinuResponse };
      
      // Use the functional form of setChatHistory to ensure the latest state is used
      setChatHistory(prev => [...prev, tinuMessage]);
      
      scrollToBottom();
  }, []); // Dependencies are not needed here since we pass the necessary data

  const onSendMessage = useCallback(async () => {
    // Use the latest chatInput from state captured by the closure
    const messageToSend = chatInput.trim();
    if (!messageToSend) return;

    const currentTopic = flashCards[currentCardIndex]?.topic || 'general';

    // 1. Add user message immediately
    const userMessage: ChatMessage = { type: 'user', message: messageToSend };
    setChatHistory(prev => [...prev, userMessage]);
    
    // 2. Clear input immediately
    setChatInput('');

    // 3. Scroll to show user message
    scrollToBottom();

    // 4. Get Tinu's response asynchronously
    await fetchTinuResponse(messageToSend, currentTopic);
  }, [chatInput, flashCards, currentCardIndex, fetchTinuResponse]);
  // --- END CHAT UTILITY FUNCTIONS ---


  const fetchFlashCards = async () => {
    try {
      setLoading(true);
      // Using the mock API_BASE_URL for consistency with DykScreen
      const response = await axios.post(`${API_BASE_URL}/p13n_answers`, {
        // ... request payload remains the same
        module_id: "1",
        parent_id: "EXAMPLEPARENT",
        child_id: "EXAMPLECHILD",
        responses: [
          {
            question_id: "q006_tantrums",
            selected_choice_ids: ["choice_b", "choice_c"],
            open_response_text: "",
            timestamp: new Date().toISOString()
          },
          {
            question_id: "q009_language_dev",
            selected_choice_ids: ["choice_c", "choice_a"],
            open_response_text: "",
            timestamp: new Date().toISOString()
          },
          {
            question_id: "q008_development_concerns",
            selected_choice_ids: ["open_response"],
            open_response_text: "His cognitive abilities being stunted by overuse of mobiles",
            timestamp: new Date().toISOString()
          }
        ]
      });

      const { flash_cards = [] } = response.data;

      // Process flash cards 
      const processedFlashCards: FlashCard[] = flash_cards.map((card: any, index: number) => ({
        card_id: card.id || String(index),
        topic: card.tinu_activation?.parameters?.topic || 'No Distractions 101',
        title: card.title || card.heading || 'Title Missing',
        content: card.content || 'Tap to learn more!',
        // Simple points extraction for demonstration
        points: card.content?.split('-').map((p: string) => p.trim()).filter((p: string) => p.length > 0) || [],
        image_url: card.image_url ? `${API_BASE_URL}${card.image_url}` : undefined,
        source: card.citation?.label || '',
        visual_elements: {
          background_color: card.visual_elements?.background_color || THEME_COLORS.CARD_BG,
          bubble_type: card.visual_elements?.bubble_type || 'normal',
        }
      }));

      setFlashCards(processedFlashCards);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching flash cards:', err);
      setError(err.message || 'Failed to load content from backend.');
    } finally {
      setLoading(false);
    }
  };

  const handleAskTinu = async () => {
    if (flashCards.length === 0) return;

    // Reset chat history when starting a new Ask Tinu session
    setChatHistory([]);
    setChatInput(''); // Clear input on opening
    setTinuData(null);
    setTinuLoading(false);
    
    try {
      setTinuLoading(true);
      // Expand the sheet first
      bottomSheetRef.current?.expand();

      const currentCard = flashCards[currentCardIndex];
      
      // Mock Tinu response activation
      const response = await axios.post(`${API_BASE_URL}/activate_tinu`, {
        child_id: "EXAMPLECHILD",
        context: "flash_card",
        module_id: "1",
        topic: currentCard.topic || "general_advice"
      });

      const { cards: tinuCards = [], chips = [], initial_message = "Ask Tinu about this flashcard!" } = response.data;

      const currentQuestion = currentCard.title || 'What can I talk about instead?';

      setTinuData({ cards: tinuCards, chips, question: currentQuestion });
      setChatHistory([{ type: 'tinu', message: initial_message }]);
      
    } catch (err) {
      console.error('Error activating Tinu:', err);
      const fallbackMsg = "Sorry, Tinu is unavailable right now.";
      setTinuData({ cards: [], chips: [], question: flashCards[currentCardIndex]?.title || 'Ask Tinu' });
      setChatHistory([{ type: 'tinu', message: fallbackMsg }]);
    } finally {
      setTinuLoading(false);
    }
  };

  const toggleCardFlip = (index: number) => {
    setFlippedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const renderCard = (card: FlashCard, index: number) => {
    if (!card) return null;
    const visualElements = card.visual_elements || {};
    const cardColor = visualElements.background_color || THEME_COLORS.CARD_BG;
    const isFlipped = flippedCards.has(index);

    return (
      <TouchableOpacity 
        activeOpacity={0.9}
        onPress={() => toggleCardFlip(index)}
        style={styles.cardWrapper}
      >
        <View style={styles.cardInnerContainer}>
          {/* --- 1. Image Section (Top Half) --- */}
          {card.image_url ? (
            <View style={styles.imageSection}>
              <Image 
                source={{ uri: card.image_url }} 
                style={styles.cardImage}
                resizeMode="cover"
              />
            </View>
          ) : (
            // Placeholder if no image URL
            <View style={[styles.imageSection, { backgroundColor: '#333' }]} />
          )}

          {/* --- 2. Content Bubble (Bottom Half) --- */}
          <View style={[styles.cardContentBubble, { backgroundColor: cardColor }]}>

            {/* Card Number Badge */}
            <View style={styles.cardNumberBadge}>
              <Text style={styles.cardNumberText}>{index + 1}</Text>
            </View>

            {/* Title */}
            <Text style={styles.cardTitle}>{card.title}</Text>

            {/* Text/Points Content */}
            {isFlipped && card.points && card.points.length > 0 ? (
              <BottomSheetScrollView style={styles.pointsContainer} showsVerticalScrollIndicator={false}>
                {card.points.map((point, idx) => (
                  <View key={idx} style={styles.pointItem}>
                    <Text style={styles.pointBullet}>•</Text>
                    <Text style={styles.pointText}>{point}</Text>
                  </View>
                ))}
              </BottomSheetScrollView>
            ) : (
              <ScrollView style={styles.textScrollView}>
                <Text style={styles.cardText}>{card.content}</Text>
              </ScrollView>
            )}

            {/* Tap Hint / Source */}
            {card.source ? (
              <TouchableOpacity style={styles.sourceLink}>
                <Ionicons name="document-text-outline" size={16} color="#fff" />
                <Text style={styles.sourceLinkText}>{card.source}</Text>
              </TouchableOpacity>
            ) : (
              !isFlipped && card.points?.length > 0 && (
                <View style={styles.tapHint}>
                  <Text style={styles.tapHintText}>Tap to see details</Text>
                </View>
              )
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };
  
  // --- renderBottomSheetContent FUNCTION ---
  const renderBottomSheetContent = () => {
    if (tinuLoading && chatHistory.length === 0) {
      return (
        <View style={styles.sheetCentered}>
          <ActivityIndicator size="large" color={THEME_COLORS.TEAL_ACCENT} />
          <Text style={styles.sheetLoadingText}>Tinu is thinking...</Text>
        </View>
      );
    }

    if (!tinuData && chatHistory.length === 0) {
       return (
        <View style={styles.sheetCentered}>
          <Text style={styles.sheetEmptyText}>Tap "Ask Tinu" to start the conversation!</Text>
        </View>
      );
    }

    const conversationStarters = tinuData?.cards.map(c => c.text || c.content || c).slice(0, 3) || [];
    const contextChips = tinuData?.chips.map(c => c.text || c.label || c).slice(0, 3) || [];


    return (
      <View style={styles.bottomSheetContent}>
        <View style={styles.tinuQuestionHeader}>
            <View style={styles.tinuAvatarSmall}>
                <Text style={styles.tinuEmojiSmall}>🤓</Text>
            </View>
            <Text style={styles.tinuQuestionText}>{tinuData?.question || 'Ask Tinu'}</Text>
        </View>

        {conversationStarters.length > 0 && (
            <View style={styles.conversationSection}>
                <Text style={styles.sectionTitle}>Aim for natural conversations</Text>
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.conversationStartersContainer}
                >
                    {conversationStarters.map((starter, index) => (
                        <TouchableOpacity key={index} style={styles.conversationStarter} onPress={() => {
                            setChatInput(starter); // Pre-fill input with starter
                        }}>
                            <Ionicons name="script-outline" size={16} color={THEME_COLORS.GRAY} style={{marginRight: 5}} />
                            <Text style={styles.conversationStarterText}>{starter}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        )}

        {contextChips.length > 0 && (
            <View style={styles.shareContextSection}>
            <Text style={styles.sectionTitle}>Share more context</Text>
            <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.contextChipsContainer}
            >
                {contextChips.map((chipText, index) => (
                    <TouchableOpacity key={index} style={styles.contextChip} onPress={() => {
                        setChatInput(chipText);
                    }}>
                        <Text style={styles.contextChipEmoji}>😊</Text> 
                        <Text style={styles.contextChipText}>{chipText}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
            </View>
        )}

        <ScrollView 
            style={styles.chatContainer} 
            ref={chatScrollViewRef}
            onContentSizeChange={scrollToBottom}
        >
          {chatHistory.map((msg, index) => (
            <ChatBubble key={index} type={msg.type} message={msg.message} />
          ))}
          {/* Show a placeholder message when Tinu is thinking during an active chat */}
          {tinuLoading && chatHistory.length > 0 && (
             <View style={styles.tinuThinkingPlaceholder}>
                <ActivityIndicator size="small" color={THEME_COLORS.TEAL_ACCENT} />
                <Text style={styles.tinuThinkingText}>Tinu is typing...</Text>
             </View>
          )}
        </ScrollView>

        <View style={styles.inputSection}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Ask me anything..."
              placeholderTextColor={THEME_COLORS.GRAY}
              value={chatInput}
              onChangeText={setChatInput}
              multiline
            />
            <TouchableOpacity 
              style={styles.sendButton}
              onPress={onSendMessage}
              disabled={!chatInput.trim() || tinuLoading} // Disable send if input is empty or Tinu is loading
            >
              <Ionicons 
                name="arrow-up-circle" 
                size={40} 
                color={chatInput.trim() && !tinuLoading ? THEME_COLORS.TEAL_ACCENT : THEME_COLORS.GRAY} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };
  // --- END renderBottomSheetContent FUNCTION ---


  const renderContent = () => {
    if (loading) {
      return (
        <SafeAreaView style={styles.container}>
          <StatusBar style="light" />
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={THEME_COLORS.TEAL_ACCENT} />
            <Text style={styles.loadingText}>Loading flash cards...</Text>
          </View>
        </SafeAreaView>
      );
    }

    if (error || flashCards.length === 0) {
      return (
        <SafeAreaView style={styles.container}>
          <StatusBar style="light" />
          <View style={styles.centered}>
            <Ionicons name="alert-circle" size={60} color={THEME_COLORS.TEAL_ACCENT} />
            <Text style={styles.errorText}>
              {error || 'No Flashcard content found. Please check the backend service.'}
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchFlashCards}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar style="light" />
        <WavyBackground />

        <View style={styles.header}>
          <TouchableOpacity>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>UNLEARN OLD PATTERNS</Text>
            <Text style={styles.headerSubtitle}>
              {flashCards[currentCardIndex]?.topic || 'No Distractions 101'}
            </Text>
          </View>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView 
          style={styles.content}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
            setCurrentCardIndex(index);
          }}
        >
          {flashCards.map((card, index) => (
            <View key={`card-${card.card_id || index}`} style={{ width: SCREEN_WIDTH }}>
              {renderCard(card, index)}
            </View>
          ))}
        </ScrollView>

        <View style={styles.bottomContainer}>
          <View style={styles.tinuContainer}>
            <View style={styles.tinuAvatar}>
              <Text style={styles.tinuEmoji}>🤓</Text>
            </View>
          </View>

          <View style={styles.askTinuContainer}>
            <Text style={styles.questionText}>
              {flashCards[currentCardIndex]?.title || 'What can I talk about instead?'}
            </Text>
            <TouchableOpacity style={styles.askButton} onPress={handleAskTinu} disabled={tinuLoading || loading}>
              <Text style={styles.askButtonText}>
                {tinuLoading ? 'Loading...' : 'Ask Tinu'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <BottomSheet
          ref={bottomSheetRef}
          index={-1}
          snapPoints={snapPoints}
          enablePanDownToClose
          backgroundStyle={styles.bottomSheetBackground}
          handleIndicatorStyle={styles.bottomSheetIndicator}
          onChange={handleSheetChanges}
        >
          {/* Use BottomSheetScrollView to make the entire sheet content scrollable */}
          <BottomSheetScrollView contentContainerStyle={styles.bottomSheetInnerContent}>
            {renderBottomSheetContent()}
          </BottomSheetScrollView>
        </BottomSheet>
      </SafeAreaView>
    );
  }

  return renderContent();
}

// --- UPDATED AND NEW STYLES ---
const styles = StyleSheet.create({
  // --- Existing Flashcard Styles ---
  didYouKnow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  didYouKnowIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: THEME_COLORS.WHITE,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  didYouKnowIcon: {
    fontSize: 14,
  },
  didYouKnowText: {
    color: THEME_COLORS.WHITE,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },
  sourceLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  sourceLinkText: {
    color: THEME_COLORS.WHITE,
    fontSize: 12,
    marginLeft: 8,
    textDecorationLine: 'underline',
  },
  container: {
    flex: 1,
    backgroundColor: THEME_COLORS.DARK_BG,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    color: THEME_COLORS.WHITE,
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    color: THEME_COLORS.WHITE,
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    backgroundColor: THEME_COLORS.TEAL_ACCENT,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
  },
  retryButtonText: {
    color: THEME_COLORS.WHITE,
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'transparent',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: THEME_COLORS.WHITE,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },
  headerSubtitle: {
    color: THEME_COLORS.GRAY,
    fontSize: 10,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  cardWrapper: {
    flex: 1,
    paddingHorizontal: CARD_MARGIN_HORIZONTAL,
    paddingVertical: 10,
  },
  cardInnerContainer: {
    flex: 1,
    borderRadius: 32,
    overflow: 'hidden',
    minHeight: Dimensions.get('window').height * 0.75,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    position: 'relative',
  },
  imageSection: {
    width: '100%',
    height: '40%',
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardContentBubble: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 24,
    paddingTop: 40, 
    justifyContent: 'flex-start',
  },
  cardNumberBadge: {
    position: 'absolute',
    top: -20, 
    left: 24,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: THEME_COLORS.WHITE,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cardNumberText: {
    color: THEME_COLORS.DARK_BG,
    fontSize: 20,
    fontWeight: '700',
  },
  cardTitle: {
    color: THEME_COLORS.WHITE,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
  },
  textScrollView: {
    flex: 1,
    maxHeight: '60%', 
    paddingBottom: 10,
  },
  cardText: {
    color: THEME_COLORS.WHITE,
    fontSize: 16,
    lineHeight: 24,
  },
  tapHint: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  tapHintText: {
    color: THEME_COLORS.WHITE,
    fontSize: 12,
    fontStyle: 'italic',
  },
  pointsContainer: {
    flex: 1,
  },
  pointItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  pointBullet: {
    color: THEME_COLORS.WHITE,
    fontSize: 16,
    marginRight: 8,
  },
  pointText: {
    flex: 1,
    color: THEME_COLORS.WHITE,
    fontSize: 16,
    lineHeight: 24,
  },
  // --- Bottom Bar & Bottom Sheet Styles ---
  bottomContainer: {
    backgroundColor: THEME_COLORS.LIGHT_BG,
    borderTopLeftRadius: 48,
    borderTopRightRadius: 48,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 16,
  },
  tinuContainer: {
    alignItems: 'center',
    marginTop: -30,
  },
  tinuAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: THEME_COLORS.WHITE,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  tinuEmoji: {
    fontSize: 32,
  },
  askTinuContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  questionText: {
    flex: 1,
    color: '#333',
    fontSize: 14,
    marginRight: 16,
    fontWeight: '600',
  },
  askButton: {
    backgroundColor: THEME_COLORS.PINK_ACCENT,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  askButtonText: {
    color: THEME_COLORS.WHITE,
    fontSize: 14,
    fontWeight: '600',
  },
  bottomSheetBackground: {
    backgroundColor: THEME_COLORS.LIGHT_BG,
  },
  bottomSheetIndicator: {
    backgroundColor: THEME_COLORS.GRAY,
  },
  // --- New Chat/BottomSheet Content Styles ---
  bottomSheetInnerContent: {
    flexGrow: 1,
    paddingBottom: 20, 
  },
  bottomSheetContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sheetCentered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  sheetLoadingText: {
    color: '#666',
    marginTop: 12,
    fontSize: 14,
  },
  sheetEmptyText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
  tinuQuestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 10,
  },
  tinuQuestionText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginLeft: 10,
  },
  tinuAvatarSmall: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: THEME_COLORS.WHITE,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tinuEmojiSmall: {
    fontSize: 18,
  },
  conversationSection: {
    paddingVertical: 5,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 10,
  },
  conversationStartersContainer: {
    paddingVertical: 5,
    paddingBottom: 15,
  },
  conversationStarter: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: THEME_COLORS.WHITE,
    padding: 15,
    borderRadius: 12,
    marginRight: 10,
    width: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  conversationStarterText: {
    fontSize: 13,
    color: '#666',
    flexShrink: 1,
  },
  shareContextSection: {
    paddingVertical: 15,
  },
  contextChipsContainer: {
    flexDirection: 'row',
  },
  contextChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME_COLORS.WHITE,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  contextChipEmoji: {
    fontSize: 16,
    marginRight: 5,
  },
  contextChipText: {
    fontSize: 13,
    color: '#333',
  },
  chatContainer: {
    flex: 1,
    paddingTop: 10,
    marginBottom: 10,
  },
  // ChatBubble Styles
  chatBubbleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 5,
    maxWidth: '85%',
  },
  userBubbleContainer: {
    alignSelf: 'flex-end',
    justifyContent: 'flex-end',
    marginRight: 0,
  },
  tinuBubbleContainer: {
    alignSelf: 'flex-start',
    marginLeft: 0,
  },
  messageContent: {
    padding: 12,
    borderRadius: 18,
    maxWidth: '100%',
  },
  userMessageContent: {
    backgroundColor: THEME_COLORS.TEAL_ACCENT,
    borderTopRightRadius: 4,
  },
  tinuMessageContent: {
    backgroundColor: THEME_COLORS.WHITE,
    borderTopLeftRadius: 4,
    marginLeft: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  userText: {
    color: THEME_COLORS.WHITE,
    fontSize: 14,
  },
  botText: { // Used for Tinu's messages
    color: '#333',
    fontSize: 14,
  },
  inputSection: {
    paddingTop: 10,
    paddingBottom: 30,
    backgroundColor: THEME_COLORS.LIGHT_BG,
    borderTopWidth: 1,
    borderTopColor: THEME_COLORS.LIGHT_GRAY,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME_COLORS.WHITE,
    borderRadius: 28,
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: THEME_COLORS.LIGHT_GRAY,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    marginHorizontal: 20, // Added margin for input container
  },
  input: {
    flex: 1,
    minHeight: 30,
    maxHeight: 100,
    color: '#333',
    fontSize: 15,
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  sendButton: {
    marginLeft: 8,
  },
  tinuThinkingPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginVertical: 5,
    marginLeft: 10,
    padding: 12,
    borderRadius: 18,
    backgroundColor: THEME_COLORS.WHITE,
    borderTopLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tinuThinkingText: {
    color: '#666',
    fontSize: 14,
    marginLeft: 8,
    fontStyle: 'italic',
  }
});