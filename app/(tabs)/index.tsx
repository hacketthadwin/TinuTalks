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
// Using BottomSheetScrollView requires proper gesture handler setup
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { BlurView } from 'expo-blur';
import Constants from 'expo-constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_HORIZONTAL_MARGIN = 4;

const API_BASE_URL = 'https://genai-images-4ea9c0ca90c8.herokuapp.com';

// Local assets
const image1 = require('../../assets/images/image1.png'); 
const image2 = require('../../assets/images/image2.png'); 
const arrowIcon = require('../../assets/images/arrow.png'); 

const LOCAL_IMAGE_MAP = {
    'dyk_image_1': image1,
    'flash_image_1': image2,
};

const THEME_COLORS = {
    DARK_BG: '#1a0a1a',
    PINK_ACCENT: '#FF6B9D',
    CARD_BG_PINK: '#a94578', 
    TEAL_ACCENT: '#4A90A4',
    LIGHT_BG: '#f5e6f0',
    WHITE: '#fff',
    GRAY: '#999',
    LIGHT_BG_BLUR: 'rgba(245, 230, 240, 0.95)',
    LIGHT_GRAY: '#ddd',
};

interface CardData {
  card_id: string;
  topic: string;
  title: string;
  description: string;
  image_url?: string;
  local_image_id?: keyof typeof LOCAL_IMAGE_MAP; 
  source?: string;
  visual_elements?: any;
  type: 'dyk' | 'flashcard'; 
}

interface TinuResponseCard {
    text?: string;
    content?: string;
}

interface TinuResponseChip {
    text?: string;
    label?: string;
}

interface ChatMessage {
  type: 'user' | 'tinu';
  message: string;
}

const ChatBubble: React.FC<ChatMessage> = ({ type, message }) => (
  <View style={[styles.chatBubble, type === 'user' ? styles.userBubble : styles.tinuBubble]}>
    {type === 'tinu' && (
      <View style={styles.tinuAvatarSmall}>
        <Text style={styles.tinuEmojiSmall}>🤓</Text>
      </View>
    )}
    <View style={[styles.messageContent, type === 'user' ? styles.userMessageContent : styles.tinuMessageContent]}>
      <Text style={type === 'user' ? styles.userText : styles.tinuText}>
        {message}
      </Text>
    </View>
  </View>
);

export default function DidYouKnowScreen() {
  const [cards, setCards] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tinuData, setTinuData] = useState<{cards: TinuResponseCard[], chips: TinuResponseChip[], question: string} | null>(null);
  const [tinuLoading, setTinuLoading] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatScrollViewRef = useRef<ScrollView>(null);

  // Correctly defined refs for the BottomSheet
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['25%', '90%'], []);
  
  const handleSheetChanges = useCallback((index: number) => {
    setIsSheetOpen(index !== -1);
  }, []);

  useEffect(() => {
    fetchDykCards();
  }, []);

  const scrollToBottom = () => {
    setTimeout(() => {
        chatScrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };
  
  const onInputChange = (text: string) => {
    setChatInput(text);
  };

  const fetchTinuResponse = async (userQuery: string) => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const mockTinuResponse = `Tinu is thinking about your query: "${userQuery}". Try clicking one of the suggested options!`;

    const tinuMessage: ChatMessage = { type: 'tinu', message: mockTinuResponse };
    setChatHistory(prev => [...prev, tinuMessage]);
    
    scrollToBottom();
  };
  
  const onSendMessage = useCallback(async () => {
    if (!chatInput.trim()) return;

    const userMessage: ChatMessage = { type: 'user', message: chatInput.trim() };
    setChatHistory(prev => [...prev, userMessage]);
    setChatInput('');
    
    scrollToBottom();
    
    await fetchTinuResponse(userMessage.message);
  }, [chatInput]);
  
  const fetchDykCards = async () => {
    try {
      setLoading(true);
      
      const response = await axios.post(`${API_BASE_URL}/p13n_answers`, {
        "module_id": "1",
        "parent_id": "EXAMPLEPARENT",
        "child_id": "EXAMPLECHILD",
        "responses": [
          {
            "question_id": "q006_tantrums",
            "selected_choice_ids": ["choice_b", "choice_c"],
            "open_response_text": "",
            "timestamp": new Date().toISOString()
          },
          {
            "question_id": "q009_language_dev",
            "selected_choice_ids": ["choice_c", "choice_a"],
            "open_response_text": "",
            "timestamp": new Date().toISOString()
          },
          {
            "question_id": "q008_development_concerns",
            "selected_choice_ids": ["open_response"],
            "open_response_text": "His cognitive abilities being stunted by overuse of mobiles",
            "timestamp": new Date().toISOString()
          }
        ]
      });
      
      const { dyk_cards = [] } = response.data;
      
      const processCard = (card: any, type: 'dyk' | 'flashcard'): CardData => ({
        card_id: card.id,
        topic: card.tinu_activation?.parameters?.topic || 'general',
        title: card.title || card.heading,
        description: card.content || '',
        image_url: card.image_url ? `${API_BASE_URL}${card.image_url}` : undefined,
        source: card.citation?.label || '',
        visual_elements: card.cause_and_effect,
        type: type,
      });

      const processedDykCards: CardData[] = dyk_cards.map((card: any) => processCard(card, 'dyk'));
      
      setCards(processedDykCards);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching cards:', err.message);
      setError('Failed to load content from backend. Check console for details.');
      setCards([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAskTinu = async () => {
    if (cards.length === 0) {
      console.log('Cannot ask Tinu: no cards loaded.');
      return;
    }
    
    // Attempt to open the bottom sheet immediately for responsiveness
    // This is the line that must execute successfully
    bottomSheetRef.current?.expand();
    
    const currentCard = cards[currentCardIndex];
    const contextType = 'did_you_know'; 
    const currentTopic = currentCard.topic || "general"; 
    
    try {
      setTinuLoading(true);
      
      const response = await axios.post(`${API_BASE_URL}/activate_tinu`, {
        "child_id": "EXAMPLECHILD",
        "context": contextType,
        "module_id": "1",
        "topic": currentTopic
      });
      
      const { cards: tinuCards = [], chips = [], initial_message = "Ask Tinu about this topic!" } = response.data;

      const currentQuestion = currentCard.title || 'What are considered distractions?';

      setTinuData({ cards: tinuCards, chips, question: currentQuestion }); 

      setChatHistory([{ type: 'tinu', message: initial_message }]);

    } catch (err: any) {
      console.error('Error activating Tinu:', err.message);
      // Close sheet if API fails after opening
      bottomSheetRef.current?.close(); 
      const fallbackMsg = "Sorry, Tinu is unavailable right now. Please try again later.";
      setTinuData({ cards: [], chips: [], question: currentCard.title || 'Ask Tinu' });
      setChatHistory([{ type: 'tinu', message: fallbackMsg }]);
    } finally {
      setTinuLoading(false);
    }
  };

  const renderCard = (card: CardData) => {
    const visualElements = card.visual_elements || {};
    const cardBgColor = THEME_COLORS.CARD_BG_PINK; 
    
    const imageSource = card.image_url 
        ? { uri: card.image_url } 
        : null; 
    
    const descriptionText = card.description && card.description.trim() 
        ? card.description 
        : 'No detailed explanation available for this card. Please check backend data.';

    return (
      <View style={styles.cardWrapper}> 
        <View style={[styles.card, { backgroundColor: THEME_COLORS.DARK_BG, padding: 0 }]}>
          
          <View style={styles.dykImageWrapper}>
              {imageSource ? (
                  <Image 
                      source={imageSource} 
                      style={styles.dykCardImage}
                      resizeMode="cover"
                  />
              ) : (
                  <View style={[styles.dykCardImage, { backgroundColor: 'rgba(255,255,255,0.1)' }]} /> 
              )}
              
              <View style={[styles.dykCurveBackground, { backgroundColor: cardBgColor }]} />

              <View style={[styles.dykBadgeContainer]}>
                <View style={styles.dykBadgeWrapper}>
                  <View style={styles.bulbCircle}>
                    <Ionicons name="bulb" size={20} color="#FFB84D" />
                  </View>
                  <Text style={styles.badgeText}>
                      DID YOU 
                      <Text style={styles.badgeTextAccent}>KNOW?</Text>
                  </Text>
                </View>
              </View>
            </View>

          <View style={[styles.dykTextContent, { backgroundColor: cardBgColor }]}>
              
              {visualElements && visualElements.cause && visualElements.effect ? (
                  <View style={styles.conceptBoxesNew}>
                      <View style={styles.conceptBoxNew}>
                          <Text style={styles.conceptText}>
                              {visualElements.cause}
                          </Text>
                      </View>
                      
                      <Image 
                          source={arrowIcon} 
                          style={styles.conceptArrowImage} 
                          resizeMode="contain"
                      />

                      <View style={styles.conceptBoxNew}>
                          <Text style={styles.conceptText}>
                              {visualElements.effect}
                          </Text>
                      </View>
                  </View>
              ) : null}

              <Text style={styles.descriptionNew}>
                  {descriptionText}
              </Text>

              {card.source && (
                  <Text style={styles.sourceNew}>{card.source}</Text>
              )}
          </View>
        </View>
      </View>
    );
  };
  
  const renderBottomSheetContent = () => {
    if (tinuLoading) {
      return (
        <View style={styles.sheetCentered}>
          <ActivityIndicator size="large" color={THEME_COLORS.TEAL_ACCENT} />
          <Text style={styles.sheetLoadingText}>Tinu is thinking...</Text>
        </View>
      );
    }

    if (!tinuData || chatHistory.length === 0) {
      return (
        <View style={styles.sheetCentered}>
          <Text style={styles.sheetEmptyText}>Tap &quot;Ask Tinu&quot; to start the conversation!</Text>
        </View>
      );
    }
    
    const conversationStarters = tinuData.cards.map(c => c.text || c.content || c);
    const contextChips = tinuData.chips.map(c => c.text || c.label || c);


    return (
      // Using a View here because the parent BottomSheet is already scrollable
      <View style={styles.bottomSheetContent}>
        <View style={styles.tinuQuestionHeader}>
            <View style={styles.tinuAvatarSmall}>
                <Text style={styles.tinuEmojiSmall}>🤓</Text>
            </View>
            <Text style={styles.tinuQuestionText}>{tinuData.question}</Text>
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
                        <View key={index} style={styles.conversationStarter}>
                            <Ionicons name="script-outline" size={16} color={THEME_COLORS.GRAY} style={{marginRight: 5}} />
                            <Text style={styles.conversationStarterText}>{starter}</Text>
                        </View>
                    ))}
                </ScrollView>
            </View>
        )}

        {contextChips.length > 0 && (
            <View style={styles.shareContextSection}>
            <Text style={styles.sectionTitle}>Share more context of Arya</Text>
            <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.contextChipsContainer}
            >
                {contextChips.map((chipText, index) => (
                    <TouchableOpacity key={index} style={styles.contextChip}>
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
        </ScrollView>

        <View style={styles.inputSection}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Ask me anything..."
              placeholderTextColor={THEME_COLORS.GRAY}
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
                color={chatInput.trim() ? THEME_COLORS.TEAL_ACCENT : THEME_COLORS.GRAY} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={THEME_COLORS.PINK_ACCENT} />
          <Text style={styles.loadingText}>Loading educational content...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || cards.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.centered}>
          <Ionicons name="alert-circle" size={60} color={THEME_COLORS.PINK_ACCENT} />
          <Text style={styles.errorText}>
            {error || 'No Did You Know content found. Please check the backend service.'}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchDykCards}>
            <Text style={styles.retryButtonText}>Retry Loading</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />
      
      {isSheetOpen && (
        <BlurView 
            tint="light" 
            intensity={40} 
            style={StyleSheet.absoluteFill} 
        />
      )}

      <View style={styles.header}>
        <TouchableOpacity>
          <Ionicons name="arrow-back" size={24} color={THEME_COLORS.WHITE} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>UNLEARN OLD PATTERNS</Text>
          <Text style={styles.headerSubtitle}>
            {cards[currentCardIndex]?.title || 'Content Loaded'}
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
        {cards.map((card, index) => (
          <View key={card.card_id || index} style={{ width: SCREEN_WIDTH }}>
            {renderCard(card)}
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
            {cards[currentCardIndex]?.title || "What are considered distractions?"}
          </Text>
          <TouchableOpacity 
            style={styles.askButton} 
            onPress={handleAskTinu}
            disabled={tinuLoading || loading}
          >
            <Text style={styles.askButtonText}>
              {tinuLoading ? 'Loading...' : 'Ask Tinu'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <BottomSheet
        ref={bottomSheetRef}
        index={-1} // Keep it closed initially
        snapPoints={snapPoints}
        enablePanDownToClose
        backgroundStyle={styles.bottomSheetBackground}
        handleIndicatorStyle={styles.bottomSheetIndicator}
        onChange={handleSheetChanges}
      >
        {/* Use BottomSheetScrollView for the content to ensure scrolling works within the sheet */}
        <BottomSheetScrollView contentContainerStyle={styles.bottomSheetInnerContent}>
          {renderBottomSheetContent()} 
        </BottomSheetScrollView>
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: THEME_COLORS.PINK_ACCENT,
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
    backgroundColor: THEME_COLORS.DARK_BG,
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
    paddingHorizontal: CARD_HORIZONTAL_MARGIN, 
  },
  card: {
    flex: 1,
    marginVertical: 10,
    borderRadius: 30,
    minHeight: Dimensions.get('window').height * 0.75,
    overflow: 'hidden',
  },
  dykImageWrapper: {
    height: '45%', 
    backgroundColor: THEME_COLORS.DARK_BG, 
    overflow: 'hidden',
    position: 'relative',
  },
  dykCardImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
  },
  dykCurveBackground: {
    position: 'absolute',
    top: '100%', 
    marginTop: -100, 
    left: 0,
    right: 0,
    height: 200, 
    borderTopLeftRadius: Dimensions.get('window').width * 0.7, 
    borderTopRightRadius: Dimensions.get('window').width * 0.7,
    transform: [{ scaleX: 1.5 }], 
  },
  dykBadgeContainer: {
  position: "absolute",
  top: '60%', 
  alignSelf: "center",
  zIndex: 10,
  },
  dykBadgeWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  bulbCircle: {
    backgroundColor: "#FFF2CC",
    borderRadius: 16,
    padding: 6,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 6,
  },
  badgeText: {
    color: "#6A4C93",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  badgeTextAccent: {
    color: "#FF7B00",
  },

  dykTextContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 45, 
    paddingBottom: 24,
    justifyContent: 'flex-start',
  },
  conceptBoxesNew: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  conceptBoxNew: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME_COLORS.WHITE,
    width: '45%', 
    alignItems: 'center',
    minHeight: 80,
    justifyContent: 'center',
  },
  conceptText: {
    color: THEME_COLORS.WHITE,
    fontSize: 14, 
    fontWeight: '600',
    textAlign: 'center',
  },
  conceptArrowImage: {
    width: 30,
    height: 30,
    tintColor: THEME_COLORS.WHITE,
    marginHorizontal: 5,
  },
  descriptionNew: {
    color: THEME_COLORS.WHITE,
    fontSize: 20, 
    fontWeight: '700', 
    lineHeight: 30,
    marginBottom: 20,
    textAlign: 'center',
  },
  sourceNew: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  bottomContainer: {
    backgroundColor: THEME_COLORS.LIGHT_BG,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 8,
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
  bottomSheetInnerContent: {
      flexGrow: 1,
      paddingBottom: 20, // Add padding at the bottom of the content
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
  chatBubble: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 5,
    maxWidth: '85%',
  },
  userBubble: {
    alignSelf: 'flex-end',
    justifyContent: 'flex-end',
    marginRight: 0,
  },
  tinuBubble: {
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
  tinuText: {
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
});