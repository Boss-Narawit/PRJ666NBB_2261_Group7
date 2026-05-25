import React from 'react';
import {
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type NavItem = {
  icon: string;
  label: string;
};

type HistoryItem = {
  id: string;
  title: string;
  image: string;
};

type ForgottenItem = {
  id: string;
  name: string;
  brand: string;
  lastWorn: string;
  image: string;
};

const navItems: NavItem[] = [
  { icon: '⌂', label: 'Home' },
  { icon: '◈', label: 'Discover' },
  { icon: '🛒', label: 'Cart' },
  { icon: '◌', label: 'Alerts' },
  { icon: '◡', label: 'Profile' },
];

const historyItems: HistoryItem[] = [
  {
    id: 'jacket',
    title: 'Jacket',
    image:
      'https://images.unsplash.com/photo-1548883354-94bcfe321cbb?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'shirts',
    title: 'Shirts',
    image:
      'https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'pants',
    title: 'Pants',
    image:
      'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'shoes',
    title: 'Shoes',
    image:
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80',
  },
];

const forgottenItems: ForgottenItem[] = [
  {
    id: 'jeans',
    name: 'Blue Jeans',
    brand: 'Calvin Klein',
    lastWorn: '2026-01-29',
    image:
      'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'cardigan',
    name: 'Flower Sweater',
    brand: 'Muji',
    lastWorn: '2026-01-29',
    image:
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'sneakers',
    name: 'Leopard Sneakers',
    brand: 'Steve Madden',
    lastWorn: '2026-01-18',
    image:
      'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=600&q=80',
  },
];

function App() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={styles.safeArea.backgroundColor}
      />
      <View style={styles.appShell}>
        <AppHeader />
        <HomeScreen />
        <BottomNavigation />
      </View>
    </SafeAreaView>
  );
}

function AppHeader() {
  return (
    <View style={styles.header}>
      <Text style={styles.brand}>ReDrobe</Text>
      <Pressable style={styles.iconButton}>
        <Text style={styles.iconText}>⚙</Text>
      </Pressable>
    </View>
  );
}

function HomeScreen() {
  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.heroCard}>
        <Image
          source={{
            uri: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80',
          }}
          style={styles.heroImage}
        />
        <Text style={styles.heroTitle}>♡My Wardrobe</Text>
      </View>

      <SectionHeader title="View History" />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.historyRow}
      >
        {historyItems.map(item => (
          <View key={item.id} style={styles.historyItem}>
            <Image source={{ uri: item.image }} style={styles.historyImage} />
            <Text style={styles.historyLabel}>{item.title}</Text>
          </View>
        ))}
      </ScrollView>

      <SectionHeader title="View Forgotten Items" />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.forgottenRow}
      >
        {forgottenItems.map(item => (
          <View key={item.id} style={styles.productCard}>
            <Image source={{ uri: item.image }} style={styles.productImage} />
            <Text style={styles.productMeta}>Last worn: {item.lastWorn}</Text>
            <Text style={styles.productName}>{item.name}</Text>
            <Text style={styles.productBrand}>{item.brand}</Text>
          </View>
        ))}
      </ScrollView>
    </ScrollView>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Pressable style={styles.chevronButton}>
        <Text style={styles.chevronText}>›</Text>
      </Pressable>
    </View>
  );
}

function BottomNavigation() {
  return (
    <View style={styles.bottomNav}>
      {navItems.map((item, index) => {
        const isActive = index === 0;

        return (
          <Pressable key={item.label} style={styles.navItem}>
            <Text style={[styles.navIcon, isActive && styles.navIconActive]}>
              {item.icon}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f7dff0',
  },
  appShell: {
    flex: 1,
    backgroundColor: '#f7dff0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#e7c9dc',
    position: 'relative',
  },
  brand: {
    fontSize: 38,
    fontWeight: '800',
    color: '#111111',
    letterSpacing: -1,
  },
  iconButton: {
    position: 'absolute',
    right: 24,
    top: 12,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 30,
    color: '#111111',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 20,
  },
  heroCard: {
    height: 305,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#eadfda',
    marginBottom: 26,
    justifyContent: 'flex-end',
  },
  heroImage: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  heroTitle: {
    paddingHorizontal: 18,
    paddingBottom: 146,
    fontSize: 28,
    fontWeight: '900',
    color: '#f66ab4',
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111111',
  },
  chevronButton: {
    marginLeft: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8eff6',
  },
  chevronText: {
    fontSize: 28,
    lineHeight: 28,
    color: '#111111',
  },
  historyRow: {
    gap: 28,
    paddingBottom: 30,
  },
  historyItem: {
    width: 128,
    alignItems: 'center',
  },
  historyImage: {
    width: 128,
    height: 128,
    borderRadius: 64,
    marginBottom: 14,
  },
  historyLabel: {
    fontSize: 22,
    fontWeight: '500',
    color: '#111111',
  },
  forgottenRow: {
    gap: 22,
    paddingBottom: 12,
  },
  productCard: {
    width: 296,
  },
  productImage: {
    width: 296,
    height: 296,
    borderRadius: 18,
    marginBottom: 14,
    backgroundColor: '#ece3ea',
  },
  productMeta: {
    fontSize: 16,
    color: '#7f7580',
    marginBottom: 6,
  },
  productName: {
    fontSize: 24,
    fontWeight: '500',
    color: '#111111',
    marginBottom: 4,
  },
  productBrand: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111111',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#e7c9dc',
    backgroundColor: '#f7dff0',
  },
  navItem: {
    width: 58,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIcon: {
    fontSize: 34,
    color: '#111111',
  },
  navIconActive: {
    fontWeight: '800',
  },
});

export default App;
