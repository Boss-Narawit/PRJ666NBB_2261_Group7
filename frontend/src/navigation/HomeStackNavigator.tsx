import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainScreen from '../screens/MainScreen';
import WardrobeScreen from '../screens/WardrobeScreen';
import AddClothScreen from '../screens/AddClothScreen';
import BatchAddScreen from '../screens/BatchAddScreen';
import WearHistoryScreen from '../screens/WearHistoryScreen';
import WearLogDetailScreen from '../screens/WearLogDetailScreen';
import EditWearLogScreen from '../screens/EditWearLogScreen';
import LogOutfitScreen from '../screens/LogOutfitScreen';
import ExportScreen from '../screens/ExportScreen';
import QualityChecklistScreen from '../screens/QualityChecklistScreen';
import ForgottenItemsScreen from '../screens/ForgottenItemsScreen';
import ItemDetailScreen from '../screens/ItemDetailScreen';
import ExportHistoryScreen from '../screens/ExportHistoryScreen';
import CareDirectoryScreen from '../screens/CareDirectoryScreen';
import { Clothing } from '../services/api';

// Screens nested inside the Home tab. Route names + params match what they were
// on the root stack, so every intra-stack navigate() call keeps working.
// MainScreen is the initial route, named `Dashboard` to avoid colliding with
// the tab's own `Home` name (getFocusedRouteNameFromRoute reads this).
export type HomeStackParamList = {
  Dashboard: undefined;
  // Optional category preselects the wardrobe filter (home screen category cards).
  Wardrobe: { category?: string } | undefined;
  AddCloth:
    | undefined
    | {
        // Prefill from an approved Thoughtful Purchase ("Buy it" → wardrobe).
        prefill?: { name?: string; imageUrl?: string; notes?: string };
      };
  BatchAdd: undefined;
  WearLog: undefined;
  LogOutfit: undefined;
  WearLogDetail: {
    logId: string;
    date: string;
    outfitName?: string;
    occasion?: string;
    items: {
      name: string;
      brand?: string;
      wearCount: number;
      image?: string;
    }[];
  };
  EditWearLog: {
    logId: string;
  };
  Export: { item?: Clothing } | undefined;
  QualityChecklist: {
    items: string[];
    type: 'resale' | 'donation';
    destination: string;
  };
  ForgottenItems: undefined;
  ItemDetail: {
    itemId?: string;
  };
  ExportHistory: undefined;
  CareDirectory: undefined;
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

// Every screen renders its own custom header, so the stack chrome stays hidden.
export default function HomeStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Dashboard" component={MainScreen} />
      <Stack.Screen name="Wardrobe" component={WardrobeScreen} />
      <Stack.Screen name="AddCloth" component={AddClothScreen} />
      <Stack.Screen name="BatchAdd" component={BatchAddScreen} />
      <Stack.Screen name="WearLog" component={WearHistoryScreen} />
      <Stack.Screen name="WearLogDetail" component={WearLogDetailScreen} />
      <Stack.Screen name="EditWearLog" component={EditWearLogScreen} />
      <Stack.Screen name="LogOutfit" component={LogOutfitScreen} />
      <Stack.Screen name="Export" component={ExportScreen} />
      <Stack.Screen
        name="QualityChecklist"
        component={QualityChecklistScreen}
      />
      <Stack.Screen name="ForgottenItems" component={ForgottenItemsScreen} />
      <Stack.Screen name="ItemDetail" component={ItemDetailScreen} />
      <Stack.Screen name="ExportHistory" component={ExportHistoryScreen} />
      <Stack.Screen name="CareDirectory" component={CareDirectoryScreen} />
    </Stack.Navigator>
  );
}
