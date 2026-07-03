import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors } from '../theme';

const { width } = Dimensions.get('window');

type Props = {
  navigation: any;
};

// Mock data for the recap
const recapData = {
  outfitsLogged: 156,
  utilizationRate: 79,
  activeItems: 45,
  totalItems: 56,
  topItems: [
    { name: 'White Sneakers', wears: 24, rank: 1 },
    { name: 'Black Hoodie', wears: 18, rank: 2 },
    { name: 'Blue Jeans', wears: 15, rank: 3 },
  ],
};

export default function StyleRecapScreen({ navigation }: Props) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const slides = [
    // Slide 1: Year Wrapped
    {
      id: 1,
      content: (
        <View style={styles.slideContainer}>
          <Text style={styles.slideTitle}>2025 Wrapped</Text>
          <Text style={styles.slideSubtitle}>Your year in style</Text>
          <View style={styles.bigNumberContainer}>
            <Text style={styles.bigNumber}>{recapData.outfitsLogged}</Text>
            <Text style={styles.bigNumberLabel}>Outfits Logged!</Text>
          </View>
          <View style={styles.emojiContainer}>
            <Text style={styles.emoji}>🎉</Text>
            <Text style={styles.emojiText}>You're making conscious style choices!</Text>
          </View>
          <View style={styles.slideIndicator}>
            <Text style={styles.slideIndicatorText}>1 / 4</Text>
          </View>
        </View>
      ),
    },
    // Slide 2: Top 3 Items
    {
      id: 2,
      content: (
        <View style={styles.slideContainer}>
          <Text style={styles.slideTitle}>Your Top 3 Items 🎁</Text>
          <Text style={styles.slideSubtitle}>Your most worn pieces of 2025</Text>
          <View style={styles.topItemsContainer}>
            {recapData.topItems.map((item, index) => (
              <View key={index} style={styles.topItemRow}>
                <View style={styles.topItemRank}>
                  <Text style={styles.topItemRankText}>#{item.rank}</Text>
                </View>
                <Text style={styles.topItemName}>{item.name}</Text>
                <Text style={styles.topItemWears}>{item.wears} wears</Text>
              </View>
            ))}
          </View>
          <View style={styles.slideIndicator}>
            <Text style={styles.slideIndicatorText}>2 / 4</Text>
          </View>
        </View>
      ),
    },
    // Slide 3: Sustainability Stats
    {
      id: 3,
      content: (
        <View style={styles.slideContainer}>
          <Text style={styles.slideTitle}>Sustainability Stats</Text>
          <Text style={styles.slideSubtitle}>
            Based on the last 90 days
            {'\n'}
            <Text style={styles.slideSubtitleSmall}>*Archived clothing excluded from stats</Text>
          </Text>
          <View style={styles.statsContainer}>
            <View style={styles.statsBigNumber}>
              <Text style={styles.statsBigNumberText}>{recapData.utilizationRate}%</Text>
              <Text style={styles.statsBigNumberLabel}>Utilization</Text>
            </View>
            <View style={styles.statsEmojiContainer}>
              <Text style={styles.statsEmoji}>😊</Text>
              <Text style={styles.statsEmojiText}>Great Work!</Text>
            </View>
            <Text style={styles.statsDescription}>
              You're actively wearing {recapData.activeItems} of your {recapData.totalItems} items
            </Text>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statsItem}>
              <Text style={styles.statsNumber}>{recapData.activeItems}</Text>
              <Text style={styles.statsLabel}>Active Items</Text>
            </View>
            <View style={styles.statsDivider} />
            <View style={styles.statsItem}>
              <Text style={styles.statsNumber}>90</Text>
              <Text style={styles.statsLabel}>Day Period</Text>
            </View>
          </View>
          <View style={styles.slideIndicator}>
            <Text style={styles.slideIndicatorText}>3 / 4</Text>
          </View>
        </View>
      ),
    },
    // Slide 4: Amazing Year
    {
      id: 4,
      content: (
        <View style={styles.slideContainer}>
          <Text style={styles.slideTitle}>Amazing Year!</Text>
          <Text style={styles.slideSubtitle}>Share your style journey with friends</Text>
          <View style={styles.finalStatsContainer}>
            <View style={styles.finalStatItem}>
              <Text style={styles.finalStatNumber}>{recapData.outfitsLogged}</Text>
              <Text style={styles.finalStatLabel}>Outfits Logged</Text>
            </View>
            <View style={styles.finalStatItem}>
              <Text style={styles.finalStatNumber}>{recapData.utilizationRate}%</Text>
              <Text style={styles.finalStatLabel}>Utilization Rate</Text>
            </View>
            <View style={styles.finalStatItem}>
              <Text style={styles.finalStatNumber}>{recapData.topItems[0].name}</Text>
              <Text style={styles.finalStatLabel}>Top Item</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.shareButton}>
            <Icon name="share-social-outline" size={20} color={colors.white} />
            <Text style={styles.shareButtonText}>Share My Recap</Text>
          </TouchableOpacity>
          <View style={styles.slideIndicator}>
            <Text style={styles.slideIndicatorText}>4 / 4</Text>
          </View>
        </View>
      ),
    },
  ];

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const slideIndex = Math.round(offsetX / width);
    setCurrentSlide(slideIndex);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    scrollViewRef.current?.scrollTo({
      x: index * width,
      animated: true,
    });
  };

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      goToSlide(currentSlide + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      goToSlide(currentSlide - 1);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Style Recap</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Carousel */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
      >
        {slides.map((slide) => (
          <View key={slide.id} style={[styles.slide, { width: width }]}>
            {slide.content}
          </View>
        ))}
      </ScrollView>

      {/* Navigation Dots */}
      <View style={styles.dotsContainer}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              currentSlide === index && styles.dotActive,
            ]}
          />
        ))}
      </View>

      {/* Navigation Buttons */}
      <View style={styles.navigationButtons}>
        {currentSlide > 0 && (
          <TouchableOpacity style={styles.navButton} onPress={handlePrev}>
            <Icon name="chevron-back" size={24} color={colors.textPrimary} />
            <Text style={styles.navButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        <View style={styles.navButtonSpacer} />
        {currentSlide < slides.length - 1 && (
          <TouchableOpacity style={styles.navButton} onPress={handleNext}>
            <Text style={styles.navButtonText}>Next</Text>
            <Icon name="chevron-forward" size={24} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: colors.background,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    alignItems: 'center',
  },
  slide: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  slideSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  slideSubtitleSmall: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  bigNumberContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  bigNumber: {
    fontSize: 72,
    fontWeight: 'bold',
    color: colors.primary,
  },
  bigNumberLabel: {
    fontSize: 18,
    color: colors.textSecondary,
    marginTop: 8,
  },
  emojiContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
    padding: 16,
    backgroundColor: colors.primary + '15',
    borderRadius: 12,
  },
  emoji: {
    fontSize: 32,
  },
  emojiText: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  slideIndicator: {
    marginTop: 24,
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: colors.inputBackground,
    borderRadius: 12,
  },
  slideIndicatorText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  topItemsContainer: {
    width: '100%',
    marginTop: 10,
    gap: 12,
  },
  topItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 12,
  },
  topItemRank: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topItemRankText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.white,
  },
  topItemName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  topItemWears: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statsContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  statsBigNumber: {
    alignItems: 'center',
  },
  statsBigNumberText: {
    fontSize: 64,
    fontWeight: 'bold',
    color: colors.primary,
  },
  statsBigNumberLabel: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  statsEmojiContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  statsEmoji: {
    fontSize: 28,
  },
  statsEmojiText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  statsDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: colors.inputBackground,
    borderRadius: 12,
    width: '100%',
  },
  statsItem: {
    flex: 1,
    alignItems: 'center',
  },
  statsNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  statsLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  statsDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.inputBorder,
  },
  finalStatsContainer: {
    width: '100%',
    gap: 12,
    marginVertical: 16,
  },
  finalStatItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
  },
  finalStatNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  finalStatLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.inputBorder,
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 20,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    gap: 4,
  },
  navButtonSpacer: {
    flex: 1,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
});