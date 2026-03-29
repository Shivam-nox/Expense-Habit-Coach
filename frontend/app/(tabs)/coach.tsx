import React, { useState, useRef } from 'react';
import { 
  View, Text, StyleSheet, TextInput, FlatList, 
  TouchableOpacity, KeyboardAvoidingView, Platform, 
  ScrollView 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView, AnimatePresence } from 'moti';
import { useApi } from '../../services/api'; 

// --- Premium Minimal Palette ---
const COLORS = {
  primary: '#2E7D6E',     // Deep Teal
  background: '#F8FAFA',  // Ultra-light cool gray/white
  surface: '#FFFFFF',     // Pure white
  text: '#0F172A',        // Slate 900
  textMuted: '#64748B',   // Slate 500
  border: '#E2E8F0',      // Slate 200
  userBubble: '#2E7D6E',  // Teal for user
  aiBubble: '#FFFFFF',    // White for AI
};

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
}

// --- Smooth Moti Typing Indicator ---
const TypingIndicator = () => {
  return (
    <MotiView 
      from={{ opacity: 0, translateY: 10 }} 
      animate={{ opacity: 1, translateY: 0 }} 
      style={styles.typingContainer}
    >
      {[0, 1, 2].map((index) => (
        <MotiView
          key={index}
          from={{ translateY: 0, opacity: 0.5 }}
          animate={{ translateY: -4, opacity: 1 }}
          transition={{
            loop: true,
            type: 'timing',
            duration: 500,
            delay: index * 150,
          }}
          style={styles.typingDot}
        />
      ))}
    </MotiView>
  );
};

// --- Fluid Moti Message Bubble ---
const AnimatedMessage = ({ item, isUser }: { item: Message, isUser: boolean }) => {
  return (
    <MotiView 
      from={{ opacity: 0, translateY: 15 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 400 }}
      style={[
        styles.messageWrapper, 
        isUser ? styles.userWrapper : styles.aiWrapper
      ]}
    >
      <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.aiBubble]}>
        {renderFormattedText(item.text, isUser)}
      </View>
    </MotiView>
  );
};

// --- Moti Action Suggestions ---
const AnimatedSuggestion = ({ title, icon, onPress, delay }: any) => {
  return (
    <MotiView 
      from={{ opacity: 0, translateX: 20 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: 'timing', duration: 400, delay }}
    >
      <TouchableOpacity 
        style={styles.sugBtn} 
        activeOpacity={0.7}
        onPress={() => onPress(title)}
      >
        <MaterialCommunityIcons name={icon} size={16} color={COLORS.primary} />
        <Text style={styles.sugText}>{title}</Text>
      </TouchableOpacity>
    </MotiView>
  );
};

// --- Markdown Text Parser ---
const renderFormattedText = (text: string, isUser: boolean) => {
  const parts = text.split(/(\*\*.*?\*\*|\*\*\*.*?\*\*\*)/g);
  const textColor = isUser ? COLORS.surface : COLORS.text;
  
  return (
    <Text style={[styles.messageText, { color: textColor }]}>
      {parts.map((part, index) => {
        if ((part.startsWith('**') && part.endsWith('**')) || (part.startsWith('***') && part.endsWith('***'))) {
          const cleanText = part.replace(/\*/g, '');
          return (
            <Text key={index} style={{ fontWeight: '800', color: textColor }}>
              {cleanText}
            </Text>
          );
        }
        return <Text key={index}>{part}</Text>;
      })}
    </Text>
  );
};

export default function ChatScreen() {
  const api = useApi(); 
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: "Hi! I'm **SHVM**, your habit coach. Want to log a spend or get an analysis of your week?", sender: 'ai' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false); 
  const flatListRef = useRef<FlatList>(null);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), text, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true); 
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const response = await api.chatWithCoach(text);
      const aiResponse: Message = { 
        id: (Date.now() + 1).toString(), 
        text: response.text, 
        sender: 'ai' 
      };
      
      setMessages(prev => [...prev, aiResponse]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    } catch (error) {
      const errorMsg: Message = {
        id: Date.now().toString(),
        text: "I'm having trouble connecting right now. Please try again in a moment.",
        sender: 'ai'
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false); 
    }
  };

 return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        /* Note: If you have a bottom tab bar or navigation header, 
           you might need to increase this offset (e.g., 60 or 90) */
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0} 
      >
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.onlineStatus} />
              <Text style={styles.headerTitle}>Coach</Text>
            </View>
          </View>

          {/* Animated Suggestions */}
          {messages.length === 1 && (
            <View style={styles.suggestions}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap: 10, paddingHorizontal: 24}}>
                  <AnimatedSuggestion title="Analyze Week" icon="chart-bar" onPress={sendMessage} delay={100} />
                  <AnimatedSuggestion title="Add Lunch ₹200" icon="plus" onPress={sendMessage} delay={200} />
                  <AnimatedSuggestion title="Saving Tips" icon="lightbulb-on-outline" onPress={sendMessage} delay={300} />
              </ScrollView>
            </View>
          )}

          {/* Chat List */}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => item.id}
            renderItem={({ item }) => <AnimatedMessage item={item} isUser={item.sender === 'user'} />}
            contentContainerStyle={styles.chatList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
            ListFooterComponent={isLoading ? <TypingIndicator /> : null} 
            keyboardDismissMode="interactive"
            showsVerticalScrollIndicator={false}
          />

          {/* Floating Premium Input */}
          <View style={styles.inputContainer}>
             <View style={styles.inputWrapper}>
                <TextInput 
                  style={styles.input}
                  placeholder="Message shvm..."
                  placeholderTextColor={COLORS.textMuted}
                  value={input}
                  onChangeText={setInput}
                  multiline
                  editable={!isLoading} 
                />
                <TouchableOpacity 
                  activeOpacity={0.7}
                  style={[styles.sendBtn, (!input.trim() || isLoading) && { opacity: 0.4 }]} 
                  onPress={() => sendMessage(input)}
                  disabled={!input.trim() || isLoading}
                >
                  <Feather name="arrow-up" size={20} color={COLORS.surface} />
                </TouchableOpacity>
             </View>
          </View>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background
  },
  
  // Header
  header: { 
    paddingHorizontal: 24, 
    paddingTop: 10,
    paddingBottom: 20, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.5)' // Very subtle line
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
    gap: 8
  },
  headerTitle: { 
    fontSize: 14, 
    fontWeight: '700', 
    color: COLORS.text,
    letterSpacing: 0.5,
    textTransform: 'uppercase'
  },
  onlineStatus: { 
    width: 8, 
    height: 8, 
    borderRadius: 4, 
    backgroundColor: '#059669' // Emerald green for active
  },
  
  // Suggestions
  suggestions: { 
    paddingTop: 20,
    paddingBottom: 10
  },
  sugBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: COLORS.surface, 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    borderRadius: 20, 
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  sugText: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: COLORS.text 
  },

  // Chat Area
  chatList: { 
    paddingHorizontal: 24, 
    paddingTop: 20,
    paddingBottom: 20,
    flexGrow: 1
  },
  messageWrapper: { 
    marginBottom: 20, 
    maxWidth: '82%' 
  },
  userWrapper: { 
    alignSelf: 'flex-end' 
  },
  aiWrapper: { 
    alignSelf: 'flex-start' 
  },
  messageBubble: { 
    paddingHorizontal: 18, 
    paddingVertical: 14, 
    borderRadius: 24,
  },
  userBubble: { 
    backgroundColor: COLORS.userBubble, 
    borderBottomRightRadius: 6,
    shadowColor: COLORS.userBubble,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3
  },
  aiBubble: { 
    backgroundColor: COLORS.surface, 
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1
  },
  messageText: { 
    fontSize: 15, 
    lineHeight: 24, 
    fontWeight: '500' 
  },

  // Typing Indicator
  typingContainer: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 24,
    borderBottomLeftRadius: 6,
    marginBottom: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary
  },

  // Input Area
  inputContainer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 10 : 32,
    backgroundColor: COLORS.background, // Solid background ensures no keyboard bleed
  },
  inputWrapper: { 
    flexDirection: 'row', 
    backgroundColor: COLORS.surface,
    borderRadius: 30,
    paddingLeft: 20,
    paddingRight: 6,
    paddingVertical: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2
  },
  input: { 
    flex: 1, 
    fontSize: 15, 
    maxHeight: 100, 
    color: COLORS.text,
    fontWeight: '500',
    paddingTop: Platform.OS === 'ios' ? 12 : 8,
    paddingBottom: Platform.OS === 'ios' ? 12 : 8,
  },
  sendBtn: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: COLORS.text, 
    alignItems: 'center', 
    justifyContent: 'center',
    marginLeft: 10
  }
});