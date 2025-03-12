import { Tabs } from 'expo-router';
import { Icon, BottomNavigation, BottomNavigationTab } from '@ui-kitten/components';
import { View } from 'react-native';

export default function TabLayout() {
  const NotesIcon = (props) => <Icon {...props} name="file-text-outline" />;
  const NewNoteIcon = (props) => <Icon {...props} name="plus-circle-outline" />;
  const SearchIcon = (props) => <Icon {...props} name="search-outline" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e5e5e5',
        }
      }}
      tabBar={({ navigation, state, descriptors, insets }) => (
        <BottomNavigation
          selectedIndex={state.index}
          onSelect={index => navigation.navigate(state.routeNames[index])}
          style={{ paddingBottom: insets.bottom }}
        >
          <BottomNavigationTab title='NOTES' icon={NotesIcon} />
          <BottomNavigationTab title='NEW NOTE' icon={NewNoteIcon} />
          <BottomNavigationTab title='SEARCH' icon={SearchIcon} />
        </BottomNavigation>
      )}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Notes'
        }}
      />
      <Tabs.Screen
        name="new"
        options={{
          title: 'New Note'
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search'
        }}
      />
    </Tabs>
  );
}